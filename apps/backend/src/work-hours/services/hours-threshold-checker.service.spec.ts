import { HoursThresholdCheckerService } from './hours-threshold-checker.service';

describe('HoursThresholdCheckerService', () => {
  it('reads and writes NotificationLog deduplication with companyId', async () => {
    const prisma = {
      settings: {
        findUnique: jest.fn().mockResolvedValue({
          alertHours: 10,
          notificationEmail: null,
        }),
      },
      workHour: {
        groupBy: jest.fn().mockResolvedValue([
          {
            companyId: 'company-1',
            projectId: null,
            _sum: { hours: 12 },
          },
        ]),
        findMany: jest.fn().mockResolvedValue([{ id: 'work-hour-1' }]),
      },
      project: { findUnique: jest.fn() },
      company: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'company-1',
          name: 'Acme',
          company: 'Acme Ltd',
        }),
      },
      notificationLog: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };
    const notifications = { sendHoursThresholdAlert: jest.fn() };
    const inAppNotifications = {
      createHoursThresholdNotification: jest.fn().mockResolvedValue(undefined),
    };
    const draftInvoices = {
      createDraft: jest.fn().mockResolvedValue({ id: 'invoice-1' }),
    };
    const service = new HoursThresholdCheckerService(
      prisma as never,
      notifications as never,
      inAppNotifications as never,
      draftInvoices as never,
    );

    await service.checkAndNotify('user-1');

    expect(prisma.notificationLog.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-1',
        companyId: 'company-1',
        type: 'HOURS_THRESHOLD',
        threshold: 10,
      }),
    });
    expect(prisma.notificationLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        companyId: 'company-1',
        type: 'HOURS_THRESHOLD',
        threshold: 10,
        totalHours: 12,
      },
    });
  });
});
