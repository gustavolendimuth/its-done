import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    // Verificar se a empresa pertence ao usuário
    const company = await this.prisma.company.findFirst({
      where: {
        id: createProjectDto.companyId,
        collaborators: { some: { userId } },
      },
    });

    if (!company) {
      throw new NotFoundException('Client not found or access denied');
    }

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        userId,
      },
      include: {
        company: true,
        _count: {
          select: {
            workHours: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, companyId?: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
        ...(companyId && { companyId }),
      },
      include: {
        company: true,
        _count: {
          select: {
            workHours: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // `_count.workHours` is the number of entries, not the amount of time
    // worked. Sum the actual hours per project so the UI can show real totals
    // and averages instead of entry counts.
    const hoursByProject = await this.prisma.workHour.groupBy({
      by: ['projectId'],
      where: {
        userId,
        projectId: { in: projects.map((p) => p.id) },
      },
      _sum: { hours: true },
    });

    const totalHoursByProject = new Map(
      hoursByProject.map((row) => [row.projectId, row._sum.hours ?? 0]),
    );

    return projects.map((project) => ({
      ...project,
      totalHours: totalHoursByProject.get(project.id) ?? 0,
    }));
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        company: true,
        workHours: {
          orderBy: {
            date: 'desc',
          },
        },
        _count: {
          select: {
            workHours: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Se está mudando a empresa, verificar se a nova empresa pertence ao usuário
    if (updateProjectDto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: updateProjectDto.companyId,
          collaborators: { some: { userId } },
        },
      });

      if (!company) {
        throw new NotFoundException('Client not found or access denied');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        company: true,
        _count: {
          select: {
            workHours: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
