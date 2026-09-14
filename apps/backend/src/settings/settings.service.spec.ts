import { SettingsService } from './settings.service';

const prismaMock = {
  settings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

const workHoursServiceMock = {
  checkNotificationManually: jest.fn().mockResolvedValue(undefined),
} as any;

describe('SettingsService - findByUserId()', () => {
  let service: SettingsService;

  beforeEach(() => {
    jest.resetAllMocks();
    workHoursServiceMock.checkNotificationManually.mockResolvedValue(
      undefined,
    );
    service = new SettingsService(prismaMock, workHoursServiceMock);
  });

  it('returns roundingIncrementMinutes 0 when no settings row exists', async () => {
    prismaMock.settings.findUnique.mockResolvedValueOnce(null);

    const result = await service.findByUserId('user-1');

    expect(result.roundingIncrementMinutes).toBe(0);
  });

  it('returns the stored roundingIncrementMinutes when a settings row exists', async () => {
    prismaMock.settings.findUnique.mockResolvedValueOnce({
      userId: 'user-1',
      alertHours: 160,
      notificationEmail: null,
      roundingIncrementMinutes: 15,
    });

    const result = await service.findByUserId('user-1');

    expect(result.roundingIncrementMinutes).toBe(15);
  });
});

describe('SettingsService - update()', () => {
  let service: SettingsService;

  beforeEach(() => {
    jest.resetAllMocks();
    workHoursServiceMock.checkNotificationManually.mockResolvedValue(
      undefined,
    );
    service = new SettingsService(prismaMock, workHoursServiceMock);
  });

  it('persists roundingIncrementMinutes on update', async () => {
    prismaMock.settings.findUnique.mockResolvedValueOnce({
      userId: 'user-1',
      alertHours: 160,
      notificationEmail: null,
      roundingIncrementMinutes: 0,
    });
    prismaMock.settings.update.mockResolvedValueOnce({
      userId: 'user-1',
      alertHours: 160,
      notificationEmail: null,
      roundingIncrementMinutes: 30,
    });

    await service.update('user-1', { roundingIncrementMinutes: 30 });

    expect(prismaMock.settings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ roundingIncrementMinutes: 30 }),
      }),
    );
  });
});
