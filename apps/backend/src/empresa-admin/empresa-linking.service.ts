import { Injectable } from '@nestjs/common';
import { ColaboradorOrigin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InAppNotificationsService } from '../in-app-notifications/in-app-notifications.service';
import { extractDomain } from './utils/domain-blocklist.util';

/**
 * Shared logic to turn a Convite Pendente / Domínio Autorizado match into an
 * actual Colaborador link. Used both by the empresa-admin endpoints
 * (immediate link when a Convite Pendente is created for an existing User)
 * and by AuthService's signup/login hooks (MW-21/MW-22).
 *
 * Also owns the notification side of the Colaborador↔Empresa relationship
 * (MW-23): every path that creates or removes a Colaborador row funnels
 * through here, so the "Colaborador is told about it" guarantee only needs
 * to be true in one place.
 */
@Injectable()
export class EmpresaLinkingService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private inAppNotificationsService: InAppNotificationsService,
  ) {}

  /**
   * Idempotent: never duplicates a Colaborador row for the same pair.
   * `origin` (MW-24 — Convite Pendente vs Domínio Autorizado) is recorded
   * only on first creation; an idempotent no-op call never overwrites it.
   */
  async ensureColaborador(
    userId: string,
    empresaId: string,
    origin?: ColaboradorOrigin,
  ) {
    const existing = await this.prisma.colaborador.findUnique({
      where: { userId_empresaId: { userId, empresaId } },
    });
    if (existing) {
      return existing;
    }

    const colaborador = await this.prisma.colaborador.create({
      data: { userId, empresaId, origin },
    });

    // Only notify when the link is actually new — never on the idempotent
    // no-op path (e.g. every subsequent login of an already-linked User).
    await this.notifyColaboradorLinked(userId, empresaId);

    return colaborador;
  }

  /**
   * MW-23: notifies the Colaborador that their link to an Empresa was
   * removed — either by themselves (`ClientsService.removeColaborador`) or
   * by an Administrador (`ColaboradoresService.remove`). Call this AFTER
   * the Colaborador row has been deleted.
   */
  async notifyColaboradorUnlinked(
    userId: string,
    empresaId: string,
    unlinkedBy: 'colaborador' | 'admin',
  ): Promise<void> {
    try {
      const [user, empresa] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.empresa.findUnique({ where: { id: empresaId } }),
      ]);
      if (!user || !empresa) {
        return;
      }

      const empresaName = empresa.name || empresa.company;
      await Promise.all([
        this.notificationsService.sendColaboradorUnlinkedEmail(
          user.email,
          user.name,
          empresaName,
          unlinkedBy,
        ),
        this.inAppNotificationsService.createColaboradorUnlinkedNotification(
          user.id,
          empresaName,
          unlinkedBy,
        ),
      ]);
    } catch (error) {
      console.error('Failed to send Colaborador unlinked notification:', error);
    }
  }

  private async notifyColaboradorLinked(
    userId: string,
    empresaId: string,
  ): Promise<void> {
    try {
      const [user, empresa] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.empresa.findUnique({ where: { id: empresaId } }),
      ]);
      if (!user || !empresa) {
        return;
      }

      const empresaName = empresa.name || empresa.company;
      await Promise.all([
        this.notificationsService.sendColaboradorLinkedEmail(
          user.email,
          user.name,
          empresaName,
        ),
        this.inAppNotificationsService.createColaboradorLinkedNotification(
          user.id,
          empresaName,
        ),
      ]);
    } catch (error) {
      console.error('Failed to send Colaborador linked notification:', error);
    }
  }

  /**
   * Call on every signup and every login (password or Google). Effectuates
   * any Convite Pendente and any confirmed Domínio Autorizado matching this
   * email. Different Empresas match independently — all are honored.
   */
  async syncAutoLinks(userId: string, email: string): Promise<void> {
    await this.linkPendingInvites(userId, email);
    await this.linkConfirmedDomains(userId, email);
  }

  private async linkPendingInvites(userId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const invites = await this.prisma.convitePendente.findMany({
      where: { email: normalizedEmail, status: 'PENDING' },
    });

    for (const invite of invites) {
      await this.ensureColaborador(userId, invite.empresaId, 'CONVITE');
      await this.prisma.convitePendente.update({
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

    const domains = await this.prisma.dominioAutorizado.findMany({
      where: { domain, status: 'CONFIRMED' },
    });

    for (const dominioAutorizado of domains) {
      await this.ensureColaborador(
        userId,
        dominioAutorizado.empresaId,
        'DOMINIO',
      );
    }
  }
}
