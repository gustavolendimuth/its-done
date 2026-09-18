import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmpresaLinkingService } from './empresa-linking.service';

/**
 * MW-23 — Administrador removing a Colaborador from their own Empresa.
 * Listing/removal is scoped to req.user.empresaId at the controller level;
 * `remove` double-checks the Colaborador actually belongs to that Empresa
 * (404s otherwise, never leaking another Empresa's Colaborador by id).
 */
@Injectable()
export class ColaboradoresService {
  constructor(
    private prisma: PrismaService,
    private empresaLinkingService: EmpresaLinkingService,
  ) {}

  findAllForEmpresa(empresaId: string) {
    return this.prisma.colaborador.findMany({
      where: { empresaId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(empresaId: string, id: string) {
    const colaborador = await this.prisma.colaborador.findFirst({
      where: { id, empresaId },
    });
    if (!colaborador) {
      throw new NotFoundException('Colaborador not found');
    }

    await this.prisma.colaborador.delete({ where: { id } });

    await this.empresaLinkingService.notifyColaboradorUnlinked(
      colaborador.userId,
      empresaId,
      'admin',
    );

    return { message: 'Colaborador removed successfully' };
  }
}
