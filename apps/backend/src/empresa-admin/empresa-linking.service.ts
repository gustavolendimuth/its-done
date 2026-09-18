import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { extractDomain } from './utils/domain-blocklist.util';

/**
 * Shared logic to turn a Convite Pendente / Domínio Autorizado match into an
 * actual Colaborador link. Used both by the empresa-admin endpoints
 * (immediate link when a Convite Pendente is created for an existing User)
 * and by AuthService's signup/login hooks (MW-21/MW-22).
 */
@Injectable()
export class EmpresaLinkingService {
  constructor(private prisma: PrismaService) {}

  /** Idempotent: never duplicates a Colaborador row for the same pair. */
  async ensureColaborador(userId: string, empresaId: string) {
    const existing = await this.prisma.colaborador.findUnique({
      where: { userId_empresaId: { userId, empresaId } },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.colaborador.create({ data: { userId, empresaId } });
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
      await this.ensureColaborador(userId, invite.empresaId);
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
      await this.ensureColaborador(userId, dominioAutorizado.empresaId);
    }
  }
}
