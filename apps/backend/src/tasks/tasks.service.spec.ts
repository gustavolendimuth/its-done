import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TasksService } from './tasks.service';

const prismaMock = {
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  client: {
    findFirst: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  workHour: {
    groupBy: jest.fn(),
  },
} as any;

describe('TasksService', () => {
  let service: TasksService;
  const userId = 'user-1';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TasksService(prismaMock);
  });

  describe('create()', () => {
    it('creates a task when the client belongs to the user', async () => {
      prismaMock.client.findFirst.mockResolvedValueOnce({ id: 'client-1' });
      prismaMock.task.create.mockResolvedValueOnce({ id: 'task-1' });

      await service.create(
        { title: 'Fix bug', clientId: 'client-1' },
        userId,
      );

      expect(prismaMock.client.findFirst).toHaveBeenCalledWith({
        where: { id: 'client-1', userId },
      });
      expect(prismaMock.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Fix bug',
            clientId: 'client-1',
            userId,
          }),
        }),
      );
    });

    it('rejects a client that does not belong to the user', async () => {
      prismaMock.client.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create({ title: 'Fix bug', clientId: 'client-1' }, userId),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('rejects a project that belongs to a different client', async () => {
      prismaMock.client.findFirst.mockResolvedValueOnce({ id: 'client-1' });
      prismaMock.project.findUnique.mockResolvedValueOnce({
        id: 'project-1',
        clientId: 'client-2',
      });

      await expect(
        service.create(
          { title: 'Fix bug', clientId: 'client-1', projectId: 'project-1' },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('accepts a project that belongs to the same client', async () => {
      prismaMock.client.findFirst.mockResolvedValueOnce({ id: 'client-1' });
      prismaMock.project.findUnique.mockResolvedValueOnce({
        id: 'project-1',
        clientId: 'client-1',
      });
      prismaMock.task.create.mockResolvedValueOnce({ id: 'task-1' });

      await service.create(
        { title: 'Fix bug', clientId: 'client-1', projectId: 'project-1' },
        userId,
      );

      expect(prismaMock.task.create).toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('attaches the summed hours per task', async () => {
      prismaMock.task.findMany.mockResolvedValueOnce([
        { id: 'task-1' },
        { id: 'task-2' },
      ]);
      prismaMock.workHour.groupBy.mockResolvedValueOnce([
        { taskId: 'task-1', _sum: { hours: 3.5 } },
      ]);

      const result = await service.findAll(userId);

      expect(result).toEqual([
        { id: 'task-1', totalHours: 3.5 },
        { id: 'task-2', totalHours: 0 },
      ]);
    });
  });

  describe('update()', () => {
    it('rejects updating to a project outside the task client', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        userId,
        clientId: 'client-1',
      });
      prismaMock.project.findUnique.mockResolvedValueOnce({
        id: 'project-1',
        clientId: 'client-2',
      });

      await expect(
        service.update('task-1', { projectId: 'project-1' }, userId),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('throws when the task does not belong to the user', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update('task-1', { title: 'New title' }, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects changing clientId while the task keeps a projectId tied to the old client', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        userId,
        clientId: 'client-1',
        projectId: 'project-1',
      });
      prismaMock.client.findFirst.mockResolvedValueOnce({ id: 'client-2' });
      prismaMock.project.findUnique.mockResolvedValueOnce({
        id: 'project-1',
        clientId: 'client-1',
      });

      await expect(
        service.update('task-1', { clientId: 'client-2' }, userId),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('allows changing clientId when the task has no projectId', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        userId,
        clientId: 'client-1',
        projectId: null,
      });
      prismaMock.client.findFirst.mockResolvedValueOnce({ id: 'client-2' });
      prismaMock.task.update.mockResolvedValueOnce({ id: 'task-1' });

      await service.update('task-1', { clientId: 'client-2' }, userId);

      expect(prismaMock.task.update).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('deletes the task, relying on onDelete: SetNull to preserve work hours', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce({
        id: 'task-1',
        userId,
      });
      prismaMock.task.delete.mockResolvedValueOnce({ id: 'task-1' });

      await service.remove('task-1', userId);

      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });

    it('throws when the task does not belong to the user', async () => {
      prismaMock.task.findFirst.mockResolvedValueOnce(null);

      await expect(service.remove('task-1', userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.task.delete).not.toHaveBeenCalled();
    });
  });
});
