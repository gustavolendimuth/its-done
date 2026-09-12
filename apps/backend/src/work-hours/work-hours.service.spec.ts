import { BadRequestException } from '@nestjs/common';
import { WorkHoursService } from './work-hours.service';

// Minimal mocks for dependencies
const prismaMock = {
  workHour: {
    create: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
} as any;

const hoursThresholdCheckerMock = {
  checkAndNotify: jest.fn(),
} as any;

describe('WorkHoursService - create()', () => {
  let service: WorkHoursService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WorkHoursService(prismaMock, hoursThresholdCheckerMock);
  });

  const userId = 'user-1';

  it('rejects creation when projectId does not belong to clientId', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({
      id: 'p1',
      clientId: 'other-client',
    });

    const dto = {
      date: new Date('2026-01-01'),
      hours: 1,
      clientId: 'c1',
      projectId: 'p1',
    } as any;

    await expect(service.create(userId, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.workHour.create).not.toHaveBeenCalled();
  });

  it('accepts creation when projectId belongs to clientId', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({
      id: 'p1',
      clientId: 'c1',
    });
    prismaMock.workHour.create.mockResolvedValueOnce({
      id: 'wh1',
      clientId: 'c1',
      projectId: 'p1',
    });

    const dto = {
      date: new Date('2026-01-01'),
      hours: 1,
      clientId: 'c1',
      projectId: 'p1',
    } as any;

    const result = await service.create(userId, dto);

    expect(prismaMock.workHour.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'wh1', clientId: 'c1', projectId: 'p1' });
  });

  it('accepts creation when no projectId is provided (unchanged behavior)', async () => {
    prismaMock.workHour.create.mockResolvedValueOnce({
      id: 'wh2',
      clientId: 'c1',
      projectId: null,
    });

    const dto = {
      date: new Date('2026-01-01'),
      hours: 1,
      clientId: 'c1',
    } as any;

    const result = await service.create(userId, dto);

    expect(prismaMock.project.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.workHour.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'wh2', clientId: 'c1', projectId: null });
  });
});
