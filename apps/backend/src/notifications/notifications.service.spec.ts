import { NotificationsService } from './notifications.service';

const configServiceMock = {
  get: jest.fn((key: string) => {
    if (key === 'FRONTEND_URL') return 'https://app.test';
    if (key === 'RESEND_API_KEY') return 'test-resend-key';
    return undefined;
  }),
} as any;

const prismaMock = {} as any;

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'FRONTEND_URL') return 'https://app.test';
      if (key === 'RESEND_API_KEY') return 'test-resend-key';
      return undefined;
    });
    service = new NotificationsService(prismaMock, configServiceMock);
    jest
      .spyOn(service as any, 'sendEmail')
      .mockResolvedValue({ id: 'email-1' });
  });

  describe('sendCompanyAdminPasswordResetEmail()', () => {
    it('points to /company-admin/reset-password, never /reset-password', async () => {
      await service.sendCompanyAdminPasswordResetEmail(
        'admin@test.local',
        'admin@test.local',
        'tok123',
      );

      const sendEmailMock = (service as any).sendEmail as jest.Mock;
      const { html } = sendEmailMock.mock.calls[0][0];

      expect(html).toContain(
        'https://app.test/company-admin/reset-password?token=tok123',
      );
      expect(html).not.toMatch(/href="https:\/\/app\.test\/reset-password\?/);
    });
  });
});
