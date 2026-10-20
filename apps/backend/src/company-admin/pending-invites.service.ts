import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyLinkingService } from './company-linking.service';

@Injectable()
export class PendingInvitesService {
  constructor(
    private prisma: PrismaService,
    private companyLinkingService: CompanyLinkingService,
  ) {}

  async create(
    companyId: string,
    createdByCompanyAdminId: string,
    emailRaw: string,
  ) {
    const email = emailRaw.trim().toLowerCase();
    const existing = await this.prisma.pendingInvite.findUnique({
      where: { companyId_email: { companyId, email } },
    });

    let invite;
    if (existing) {
      if (existing.status !== 'REVOKED') {
        throw new ConflictException(
          'A pending invite already exists for this email in this Company',
        );
      }
      invite = await this.prisma.pendingInvite.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING',
          createdByCompanyAdminId,
          linkedAt: null,
        },
      });
    } else {
      invite = await this.prisma.pendingInvite.create({
        data: { companyId, email, createdByCompanyAdminId },
      });
    }

    // If the User already exists, effectuate the Collaborator link right away.
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      await this.companyLinkingService.ensureCollaborator(
        user.id,
        companyId,
        'INVITE',
      );
      invite = await this.prisma.pendingInvite.update({
        where: { id: invite.id },
        data: { status: 'LINKED', linkedAt: new Date() },
      });
    }

    return invite;
  }

  findAll(companyId: string) {
    return this.prisma.pendingInvite.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(companyId: string, id: string) {
    const invite = await this.prisma.pendingInvite.findFirst({
      where: { id, companyId },
    });
    if (!invite) {
      throw new NotFoundException('Pending invite not found');
    }
    if (invite.status === 'LINKED') {
      throw new BadRequestException(
        'A pending invite that has already linked cannot be revoked',
      );
    }

    return this.prisma.pendingInvite.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
