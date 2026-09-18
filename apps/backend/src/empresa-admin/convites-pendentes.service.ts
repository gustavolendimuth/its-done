import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmpresaLinkingService } from './empresa-linking.service';

@Injectable()
export class ConvitesPendentesService {
  constructor(
    private prisma: PrismaService,
    private empresaLinkingService: EmpresaLinkingService,
  ) {}

  async create(
    empresaId: string,
    createdByEmpresaAdminId: string,
    emailRaw: string,
  ) {
    const email = emailRaw.trim().toLowerCase();
    const existing = await this.prisma.convitePendente.findUnique({
      where: { empresaId_email: { empresaId, email } },
    });

    let invite;
    if (existing) {
      if (existing.status !== 'REVOKED') {
        throw new ConflictException(
          'Já existe um Convite Pendente para este email nesta Empresa',
        );
      }
      invite = await this.prisma.convitePendente.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING',
          createdByEmpresaAdminId,
          linkedAt: null,
        },
      });
    } else {
      invite = await this.prisma.convitePendente.create({
        data: { empresaId, email, createdByEmpresaAdminId },
      });
    }

    // If the User already exists, effectuate the Colaborador link right away.
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      await this.empresaLinkingService.ensureColaborador(user.id, empresaId);
      invite = await this.prisma.convitePendente.update({
        where: { id: invite.id },
        data: { status: 'LINKED', linkedAt: new Date() },
      });
    }

    return invite;
  }

  findAll(empresaId: string) {
    return this.prisma.convitePendente.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(empresaId: string, id: string) {
    const invite = await this.prisma.convitePendente.findFirst({
      where: { id, empresaId },
    });
    if (!invite) {
      throw new NotFoundException('Convite Pendente não encontrado');
    }
    if (invite.status === 'LINKED') {
      throw new BadRequestException(
        'Convite Pendente já efetivado não pode ser revogado',
      );
    }

    return this.prisma.convitePendente.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}
