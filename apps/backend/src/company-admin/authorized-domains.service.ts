import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { COMPANY_ADMIN_ACTOR_TYPE } from './company-admin-auth.service';
import {
  isPublicProviderDomain,
  isValidDomainFormat,
  normalizeDomain,
} from './utils/domain-blocklist.util';

const DOMAIN_CONFIRMATION_TOKEN_TYPE = 'domain-confirmation';

@Injectable()
export class AuthorizedDomainsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async create(companyId: string, domainRaw: string) {
    const domain = normalizeDomain(domainRaw);

    if (!isValidDomainFormat(domain)) {
      throw new BadRequestException('Invalid domain');
    }

    if (isPublicProviderDomain(domain)) {
      throw new BadRequestException(
        'Public email provider domains cannot be registered as an authorized domain',
      );
    }

    const existing = await this.prisma.authorizedDomain.findUnique({
      where: { companyId_domain: { companyId, domain } },
    });

    if (existing && existing.status !== 'REVOKED') {
      throw new ConflictException(
        'This domain is already registered for this Company',
      );
    }

    if (existing) {
      return this.prisma.authorizedDomain.update({
        where: { id: existing.id },
        data: { status: 'PENDING', confirmedAt: null },
      });
    }

    return this.prisma.authorizedDomain.create({
      data: { companyId, domain },
    });
  }

  findAll(companyId: string) {
    return this.prisma.authorizedDomain.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Sends a confirmation link to the currently logged-in Admin's own
   * email (not to the domain being registered) — the Admin already
   * proved ownership of that email at Activation/login time, so this avoids
   * needing a generic admin@domain address.
   */
  async requestConfirmation(companyId: string, id: string, adminEmail: string) {
    const authorizedDomain = await this.prisma.authorizedDomain.findFirst({
      where: { id, companyId },
    });
    if (!authorizedDomain) {
      throw new NotFoundException('Authorized domain not found');
    }
    if (authorizedDomain.status !== 'PENDING') {
      throw new BadRequestException(
        'Authorized domain is not pending confirmation',
      );
    }

    const token = this.jwtService.sign(
      {
        sub: authorizedDomain.id,
        companyId,
        actorType: COMPANY_ADMIN_ACTOR_TYPE,
        type: DOMAIN_CONFIRMATION_TOKEN_TYPE,
      },
      { expiresIn: '1h' },
    );

    await this.notificationsService.sendAuthorizedDomainConfirmationEmail(
      adminEmail,
      authorizedDomain.domain,
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
      payload.actorType !== COMPANY_ADMIN_ACTOR_TYPE
    ) {
      throw new BadRequestException('Invalid confirmation token');
    }

    const authorizedDomain = await this.prisma.authorizedDomain.findUnique({
      where: { id: payload.sub },
    });
    if (!authorizedDomain || authorizedDomain.companyId !== payload.companyId) {
      throw new NotFoundException('Authorized domain not found');
    }
    if (authorizedDomain.status !== 'PENDING') {
      throw new BadRequestException(
        'Authorized domain is not pending confirmation',
      );
    }

    return this.prisma.authorizedDomain.update({
      where: { id: authorizedDomain.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
  }

  async revoke(companyId: string, id: string) {
    const authorizedDomain = await this.prisma.authorizedDomain.findFirst({
      where: { id, companyId },
    });
    if (!authorizedDomain) {
      throw new NotFoundException('Authorized domain not found');
    }

    return this.prisma.authorizedDomain.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
