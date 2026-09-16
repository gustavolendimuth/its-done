import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private async assertClientOwnership(clientId: string, userId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      throw new NotFoundException('Client not found or access denied');
    }
  }

  private async assertProjectBelongsToClient(
    projectId: string,
    clientId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.clientId !== clientId) {
      throw new BadRequestException(
        'Project does not belong to the selected client',
      );
    }
  }

  async create(createTaskDto: CreateTaskDto, userId: string) {
    await this.assertClientOwnership(createTaskDto.clientId, userId);

    if (createTaskDto.projectId) {
      await this.assertProjectBelongsToClient(
        createTaskDto.projectId,
        createTaskDto.clientId,
      );
    }

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        userId,
      },
      include: {
        client: true,
        project: true,
      },
    });
  }

  async findAll(userId: string, clientId?: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        ...(clientId && { clientId }),
      },
      include: {
        client: true,
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const hoursByTask = await this.prisma.workHour.groupBy({
      by: ['taskId'],
      where: {
        userId,
        taskId: { in: tasks.map((t) => t.id) },
      },
      _sum: { hours: true },
    });

    const totalHoursByTask = new Map(
      hoursByTask.map((row) => [row.taskId, row._sum.hours ?? 0]),
    );

    return tasks.map((task) => ({
      ...task,
      totalHours: totalHoursByTask.get(task.id) ?? 0,
    }));
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: {
        client: true,
        project: true,
        workHours: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (updateTaskDto.clientId) {
      await this.assertClientOwnership(updateTaskDto.clientId, userId);
    }

    if (updateTaskDto.projectId) {
      await this.assertProjectBelongsToClient(
        updateTaskDto.projectId,
        updateTaskDto.clientId ?? task.clientId,
      );
    } else if (
      updateTaskDto.clientId &&
      updateTaskDto.clientId !== task.clientId &&
      task.projectId
    ) {
      // Client is changing but projectId wasn't given in this update — the
      // Task's existing Project (tied to the old client) would otherwise be
      // left dangling, violating "Project must belong to the same Client as
      // the Task" (Story 28). Require the caller to also update/clear it.
      await this.assertProjectBelongsToClient(
        task.projectId,
        updateTaskDto.clientId,
      );
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        client: true,
        project: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // WorkHour.taskId/WorkSession.taskId use onDelete: SetNull — deleting a
    // Task never destroys the hours already logged against it.
    await this.prisma.task.delete({
      where: { id },
    });

    return { message: 'Task deleted successfully' };
  }
}
