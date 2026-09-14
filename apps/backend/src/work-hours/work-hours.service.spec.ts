import { BadRequestException } from '@nestjs/common';

import { WorkHoursService } from './work-hours.service';

const prismaMock = {
  workHour: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
} as any;

const hoursThresholdCheckerMock = {
  checkAndNotify: jest.fn().mockResolvedValue(undefined),
} as any;

const settingsServiceMock = {
  findByUserId: jest.fn(),
} as any;

describe('WorkHoursService - create()', () => {
  let service: WorkHoursService;

  beforeEach(() => {
    jest.resetAllMocks();
    hoursThresholdCheckerMock.checkAndNotify.mockResolvedValue(undefined);
    service = new WorkHoursService(
      prismaMock,
      hoursThresholdCheckerMock,
      settingsServiceMock,
    );
  });

  it('persists the raw hours when no rounding increment is configured', async () => {
    settingsServiceMock.findByUserId.mockResolvedValueOnce({
      roundingIncrementMinutes: 0,
    });
    prismaMock.workHour.create.mockResolvedValueOnce({ id: 'wh1', hours: 1.37 });

    await service.create('user-1', {
      date: new Date('2026-01-01'),
      hours: 1.37,
      clientId: 'client-1',
    } as any);

    expect(prismaMock.workHour.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hours: 1.37 }),
      }),
    );
  });

  it('persists the rounded hours when a rounding increment is configured', async () => {
    settingsServiceMock.findByUserId.mockResolvedValueOnce({
      roundingIncrementMinutes: 15,
    });
    prismaMock.workHour.create.mockResolvedValueOnce({ id: 'wh1', hours: 1.25 });

    await service.create('user-1', {
      date: new Date('2026-01-01'),
      hours: 1.37,
      clientId: 'client-1',
    } as any);

    expect(prismaMock.workHour.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hours: 1.25 }),
      }),
    );
  });

  it('rejects when rounding produces less than 0.1 hours', async () => {
    settingsServiceMock.findByUserId.mockResolvedValueOnce({
      roundingIncrementMinutes: 60,
    });

    await expect(
      service.create('user-1', {
        date: new Date('2026-01-01'),
        hours: 0.2,
        clientId: 'client-1',
      } as any),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.workHour.create).not.toHaveBeenCalled();
  });
});

describe('WorkHoursService - update()', () => {
  let service: WorkHoursService;

  beforeEach(() => {
    jest.resetAllMocks();
    hoursThresholdCheckerMock.checkAndNotify.mockResolvedValue(undefined);
    service = new WorkHoursService(
      prismaMock,
      hoursThresholdCheckerMock,
      settingsServiceMock,
    );
  });

  it('persists the rounded hours when hours is edited and a rounding increment is configured', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: 'wh1',
      userId: 'user-1',
    });
    settingsServiceMock.findByUserId.mockResolvedValueOnce({
      roundingIncrementMinutes: 30,
    });
    prismaMock.workHour.update.mockResolvedValueOnce({ id: 'wh1', hours: 1.5 });

    await service.update('user-1', 'wh1', { hours: 1.37 } as any);

    expect(prismaMock.workHour.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wh1' },
        data: expect.objectContaining({ hours: 1.5 }),
      }),
    );
  });

  it('rejects when rounding produces less than 0.1 hours', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: 'wh1',
      userId: 'user-1',
    });
    settingsServiceMock.findByUserId.mockResolvedValueOnce({
      roundingIncrementMinutes: 60,
    });

    await expect(
      service.update('user-1', 'wh1', { hours: 0.2 } as any),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.workHour.update).not.toHaveBeenCalled();
  });

  it('does not consult rounding when hours is not part of the update', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: 'wh1',
      userId: 'user-1',
    });
    prismaMock.workHour.update.mockResolvedValueOnce({
      id: 'wh1',
      description: 'updated',
    });

    await service.update('user-1', 'wh1', { description: 'updated' } as any);

    expect(settingsServiceMock.findByUserId).not.toHaveBeenCalled();
    expect(prismaMock.workHour.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { description: 'updated' },
      }),
    );
  });
});
