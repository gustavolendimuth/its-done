import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmpresaAdminsService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.empresaAdmin.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.empresaAdmin.findUnique({ where: { id } });
  }
}
