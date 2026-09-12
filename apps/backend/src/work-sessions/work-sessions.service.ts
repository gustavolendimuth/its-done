import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkSessionsService {
  constructor(private prisma: PrismaService) {}
}
