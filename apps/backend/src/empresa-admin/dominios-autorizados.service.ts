import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EMPRESA_ADMIN_ACTOR_TYPE } from './empresa-admin-auth.service';
import {
  isPublicProviderDomain,
  isValidDomainFormat,
  normalizeDomain,
} from './utils/domain-blocklist.util';

const DOMAIN_CONFIRMATION_TOKEN_TYPE = 'domain-confirmation';

@Injectable()
export class DominiosAutorizadosService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async create(empresaId: string, domainRaw: string) {
    const domain = normalizeDomain(domainRaw);

    if (!isValidDomainFormat(domain)) {
      throw new BadRequestException('Domínio inválido');
    }

    if (isPublicProviderDomain(domain)) {
      throw new BadRequestException(
        'Domínios de provedores públicos de email não podem ser registrados como Domínio Autorizado',
      );
    }

    const existing = await this.prisma.dominioAutorizado.findUnique({
      where: { empresaId_domain: { empresaId, domain } },
    });

    if (existing && existing.status !== 'REVOKED') {
      throw new ConflictException(
        'Este domínio já está registrado para esta Empresa',
      );
    }

    if (existing) {
      return this.prisma.dominioAutorizado.update({
        where: { id: existing.id },
        data: { status: 'PENDING', confirmedAt: null },
      });
    }

    return this.prisma.dominioAutorizado.create({
      data: { empresaId, domain },
    });
  }

  findAll(empresaId: string) {
    return this.prisma.dominioAutorizado.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Sends a confirmation link to the currently logged-in Administrador's own
   * email (not to the domain being registered) — the Administrador already
   * proved ownership of that email at Ativação/login time, so this avoids
   * needing a generic admin@domain address.
   */
  async requestConfirmation(
    empresaId: string,
    id: string,
    adminEmail: string,
  ) {
    const dominioAutorizado = await this.prisma.dominioAutorizado.findFirst({
      where: { id, empresaId },
    });
    if (!dominioAutorizado) {
      throw new NotFoundException('Domínio Autorizado não encontrado');
    }
    if (dominioAutorizado.status !== 'PENDING') {
      throw new BadRequestException(
        'Domínio Autorizado não está pendente de confirmação',
      );
    }

    const token = this.jwtService.sign(
      {
        sub: dominioAutorizado.id,
        empresaId,
        actorType: EMPRESA_ADMIN_ACTOR_TYPE,
        type: DOMAIN_CONFIRMATION_TOKEN_TYPE,
      },
      { expiresIn: '1h' },
    );

    // Reuses the existing password-reset email infrastructure to deliver the
    // confirmation link — no dedicated email template was added (out of
    // scope: apps/backend/src/notifications/ was not touched).
    await this.notificationsService.sendPasswordResetEmail(
      adminEmail,
      adminEmail,
      token,
    );

    return {
      message: 'Confirmation link sent to your own admin email.',
    };
  }

  async confirm(token: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired confirmation token');
    }

    if (
      payload.type !== DOMAIN_CONFIRMATION_TOKEN_TYPE ||
      payload.actorType !== EMPRESA_ADMIN_ACTOR_TYPE
    ) {
      throw new BadRequestException('Invalid confirmation token');
    }

    const dominioAutorizado = await this.prisma.dominioAutorizado.findUnique({
      where: { id: payload.sub },
    });
    if (!dominioAutorizado || dominioAutorizado.empresaId !== payload.empresaId) {
      throw new NotFoundException('Domínio Autorizado não encontrado');
    }
    if (dominioAutorizado.status !== 'PENDING') {
      throw new BadRequestException(
        'Domínio Autorizado não está pendente de confirmação',
      );
    }

    return this.prisma.dominioAutorizado.update({
      where: { id: dominioAutorizado.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
  }

  async revoke(empresaId: string, id: string) {
    const dominioAutorizado = await this.prisma.dominioAutorizado.findFirst({
      where: { id, empresaId },
    });
    if (!dominioAutorizado) {
      throw new NotFoundException('Domínio Autorizado não encontrado');
    }

    return this.prisma.dominioAutorizado.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
