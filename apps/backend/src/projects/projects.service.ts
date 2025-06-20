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
    // Verificar se o cliente pertence ao usuário
    const client = await this.prisma.client.findFirst({
      where: {
        id: createProjectDto.clientId,
        userId: userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found or access denied');
    }

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        userId,
      },
      include: {
        client: true,
        _count: {
          select: {
            workHours: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, clientId?: string) {
    return this.prisma.project.findMany({
      where: {
        userId,
        ...(clientId && { clientId }),
      },
      include: {
        client: true,
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
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
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

    // Se está mudando o cliente, verificar se o novo cliente pertence ao usuário
    if (updateProjectDto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: updateProjectDto.clientId,
          userId: userId,
        },
      });

      if (!client) {
        throw new NotFoundException('Client not found or access denied');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        client: true,
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
