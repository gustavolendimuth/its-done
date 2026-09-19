import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyLinkingService } from './company-linking.service';

/**
 * MW-23 — Administrador removing a Collaborator from their own Company.
 * Listing/removal is scoped to req.user.companyId at the controller level;
 * `remove` double-checks the Collaborator actually belongs to that Company
 * (404s otherwise, never leaking another Company's Collaborator by id).
 */
@Injectable()
export class CollaboratorsService {
  constructor(
    private prisma: PrismaService,
    private companyLinkingService: CompanyLinkingService,
  ) {}

  findAllForCompany(companyId: string) {
    return this.prisma.collaborator.findMany({
      where: { companyId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(companyId: string, id: string) {
    const collaborator = await this.prisma.collaborator.findFirst({
      where: { id, companyId },
    });
    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.prisma.collaborator.delete({ where: { id } });

    await this.companyLinkingService.notifyCollaboratorUnlinked(
      collaborator.userId,
      companyId,
      'admin',
    );

    return { message: 'Collaborator removed successfully' };
  }
}
