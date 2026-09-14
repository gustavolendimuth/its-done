import { BadRequestException } from '@nestjs/common';
import { WorkHoursService } from './work-hours.service';

// Minimal mocks for dependencies
const prismaMock = {
  workHour: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
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

  it('persists startTime and endTime when provided', async () => {
    prismaMock.workHour.create.mockResolvedValueOnce({ id: 'wh3' });

    const dto = {
      date: new Date('2026-01-01'),
      hours: 3.5,
      clientId: 'c1',
      startTime: '09:00',
      endTime: '12:30',
    } as any;

    await service.create(userId, dto);

    expect(prismaMock.workHour.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startTime: '09:00',
          endTime: '12:30',
        }),
      }),
    );
  });

  it('persists null startTime and endTime when only hours is provided', async () => {
    prismaMock.workHour.create.mockResolvedValueOnce({ id: 'wh4' });

    const dto = {
      date: new Date('2026-01-01'),
      hours: 1,
      clientId: 'c1',
    } as any;

    await service.create(userId, dto);

    expect(prismaMock.workHour.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startTime: undefined,
          endTime: undefined,
        }),
      }),
    );
  });

  it('rejects creation when only one of startTime/endTime is provided', async () => {
    const dto = {
      date: new Date('2026-01-01'),
      hours: 1,
      clientId: 'c1',
      startTime: '09:00',
    } as any;

    await expect(service.create(userId, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.workHour.create).not.toHaveBeenCalled();
  });

  it('rejects creation when endTime is not after startTime', async () => {
    const dto = {
      date: new Date('2026-01-01'),
      hours: 1,
      clientId: 'c1',
      startTime: '12:00',
      endTime: '12:00',
    } as any;

    await expect(service.create(userId, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.workHour.create).not.toHaveBeenCalled();
  });
});

describe('WorkHoursService - update()', () => {
  let service: WorkHoursService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WorkHoursService(prismaMock, hoursThresholdCheckerMock);
  });

  const userId = 'user-1';
  const workHourId = 'wh-1';
  const dto = { hours: 2 } as any;

  it('throws BadRequestException when linked to a PENDING invoice', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: workHourId,
      userId,
      invoiceWorkHours: [{ invoice: { status: 'PENDING' } }],
    });

    await expect(service.update(userId, workHourId, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.workHour.update).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when linked to a PAID invoice', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: workHourId,
      userId,
      invoiceWorkHours: [{ invoice: { status: 'PAID' } }],
    });

    await expect(service.update(userId, workHourId, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prismaMock.workHour.update).not.toHaveBeenCalled();
  });

  it('proceeds when linked only to a CANCELED invoice', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: workHourId,
      userId,
      invoiceWorkHours: [{ invoice: { status: 'CANCELED' } }],
    });
    prismaMock.workHour.update.mockResolvedValueOnce({
      id: workHourId,
      hours: 2,
    });

    const result = await service.update(userId, workHourId, dto);

    expect(prismaMock.workHour.update).toHaveBeenCalled();
    expect(result).toEqual({ id: workHourId, hours: 2 });
  });

  it('proceeds when not linked to any invoice', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: workHourId,
      userId,
      invoiceWorkHours: [],
    });
    prismaMock.workHour.update.mockResolvedValueOnce({
      id: workHourId,
      hours: 2,
    });

    const result = await service.update(userId, workHourId, dto);

    expect(prismaMock.workHour.update).toHaveBeenCalled();
    expect(result).toEqual({ id: workHourId, hours: 2 });
  });

  it('allows patching a single time field when the row already has both', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: workHourId,
      userId,
      startTime: '09:00',
      endTime: '12:30',
      invoiceWorkHours: [],
    });
    prismaMock.workHour.update.mockResolvedValueOnce({ id: workHourId });

    await service.update(userId, workHourId, { startTime: '10:00' } as any);

    expect(prismaMock.workHour.update).toHaveBeenCalled();
  });

  it('rejects patching a single time field when the row has neither', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: workHourId,
      userId,
      startTime: null,
      endTime: null,
      invoiceWorkHours: [],
    });

    await expect(
      service.update(userId, workHourId, { startTime: '10:00' } as any),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.workHour.update).not.toHaveBeenCalled();
  });

  it('rejects an update that makes the merged endTime not after startTime', async () => {
    prismaMock.workHour.findFirst.mockResolvedValueOnce({
      id: workHourId,
      userId,
      startTime: '09:00',
      endTime: '17:00',
      invoiceWorkHours: [],
    });

    await expect(
      service.update(userId, workHourId, { endTime: '08:00' } as any),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.workHour.update).not.toHaveBeenCalled();
  });
});
