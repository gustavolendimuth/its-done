import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyAdminsService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.companyAdmin.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.companyAdmin.findUnique({ where: { id } });
  }
}
