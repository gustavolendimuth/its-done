import { Injectable } from '@nestjs/common';
import { CollaboratorOrigin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InAppNotificationsService } from '../in-app-notifications/in-app-notifications.service';
import { extractDomain } from './utils/domain-blocklist.util';

/**
 * Shared logic to turn a Pending Invite / Authorized Domain match into an
 * actual Collaborator link. Used both by the company-admin endpoints
 * (immediate link when a Pending Invite is created for an existing User)
 * and by AuthService's signup/login hooks (MW-21/MW-22).
 *
 * Also owns the notification side of the Collaborator↔Company relationship
 * (MW-23): every path that creates or removes a Collaborator row funnels
 * through here, so the "Collaborator is told about it" guarantee only needs
 * to be true in one place.
 */
@Injectable()
export class CompanyLinkingService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private inAppNotificationsService: InAppNotificationsService,
  ) {}

  /**
   * Idempotent: never duplicates a Collaborator row for the same pair.
   * `origin` (MW-24 — Pending Invite vs Authorized Domain) is recorded
   * only on first creation; an idempotent no-op call never overwrites it.
   */
  async ensureCollaborator(
    userId: string,
    companyId: string,
    origin?: CollaboratorOrigin,
  ) {
    const existing = await this.prisma.collaborator.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (existing) {
      return existing;
    }

    const collaborator = await this.prisma.collaborator.create({
      data: { userId, companyId, origin },
    });

    // Only notify when the link is actually new — never on the idempotent
    // no-op path (e.g. every subsequent login of an already-linked User).
    await this.notifyCollaboratorLinked(userId, companyId);

    return collaborator;
  }

  /**
   * MW-23: notifies the Collaborator that their link to an Company was
   * removed — either by themselves (`ClientsService.removeCollaborator`) or
   * by an Admin (`CollaboratorsService.remove`). Call this AFTER
   * the Collaborator row has been deleted.
   */
  async notifyCollaboratorUnlinked(
    userId: string,
    companyId: string,
    unlinkedBy: 'collaborator' | 'admin',
  ): Promise<void> {
    try {
      const [user, company] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.company.findUnique({ where: { id: companyId } }),
      ]);
      if (!user || !company) {
        return;
      }

      const companyName = company.name || company.company;
      await Promise.all([
        this.notificationsService.sendCollaboratorUnlinkedEmail(
          user.email,
          user.name,
          companyName,
          unlinkedBy,
        ),
        this.inAppNotificationsService.createCollaboratorUnlinkedNotification(
          user.id,
          companyName,
          unlinkedBy,
        ),
      ]);
    } catch (error) {
      console.error('Failed to send Collaborator unlinked notification:', error);
    }
  }

  private async notifyCollaboratorLinked(
    userId: string,
    companyId: string,
  ): Promise<void> {
    try {
      const [user, company] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.company.findUnique({ where: { id: companyId } }),
      ]);
      if (!user || !company) {
        return;
      }

      const companyName = company.name || company.company;
      await Promise.all([
        this.notificationsService.sendCollaboratorLinkedEmail(
          user.email,
          user.name,
          companyName,
        ),
        this.inAppNotificationsService.createCollaboratorLinkedNotification(
          user.id,
          companyName,
        ),
      ]);
    } catch (error) {
      console.error('Failed to send Collaborator linked notification:', error);
    }
  }

  /**
   * Call on every signup and every login (password or Google). Effectuates
   * any Pending Invite and any confirmed Authorized Domain matching this
   * email. Different Companies match independently — all are honored.
   */
  async syncAutoLinks(userId: string, email: string): Promise<void> {
    await this.linkPendingInvites(userId, email);
    await this.linkConfirmedDomains(userId, email);
  }

  private async linkPendingInvites(userId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const invites = await this.prisma.pendingInvite.findMany({
      where: { email: normalizedEmail, status: 'PENDING' },
    });

    for (const invite of invites) {
      await this.ensureCollaborator(userId, invite.companyId, 'INVITE');
      await this.prisma.pendingInvite.update({
        where: { id: invite.id },
        data: { status: 'LINKED', linkedAt: new Date() },
      });
    }
  }

  private async linkConfirmedDomains(userId: string, email: string) {
    const domain = extractDomain(email);
    if (!domain) {
      return;
    }

    const domains = await this.prisma.authorizedDomain.findMany({
      where: { domain, status: 'CONFIRMED' },
    });

    for (const authorizedDomain of domains) {
      await this.ensureCollaborator(
        userId,
        authorizedDomain.companyId,
        'DOMAIN',
      );
    }
  }
}
