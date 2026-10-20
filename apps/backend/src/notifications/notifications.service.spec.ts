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

  describe('sendAuthorizedDomainConfirmationEmail()', () => {
    const sendEmailMock = () => (service as any).sendEmail as jest.Mock;

    it('sendAuthorizedDomainConfirmationEmail sends to the admin with its own subject', async () => {
      await service.sendAuthorizedDomainConfirmationEmail(
        'admin@test.local',
        'acme.com',
        'tok123',
      );

      const { to, subject } = sendEmailMock().mock.calls[0][0];
      expect(to).toBe('admin@test.local');
      expect(subject).toBe('Confirm Authorized Domain - Its Done');
    });

    it('sendAuthorizedDomainConfirmationEmail links to the domain confirmation page', async () => {
      await service.sendAuthorizedDomainConfirmationEmail(
        'admin@test.local',
        'acme.com',
        'tok123',
      );

      const { html } = sendEmailMock().mock.calls[0][0];
      expect(html).toContain(
        'https://app.test/company-admin/domains/confirm?token=tok123',
      );
      expect(html).toContain('acme.com');
      expect(html).not.toContain('/reset-password');
      expect(html).not.toMatch(/reset your password/i);
    });

    it('sendAuthorizedDomainConfirmationEmail returns false when the send fails', async () => {
      sendEmailMock().mockRejectedValueOnce(new Error('resend down'));
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(
        service.sendAuthorizedDomainConfirmationEmail(
          'admin@test.local',
          'acme.com',
          'tok123',
        ),
      ).resolves.toBe(false);
    });
  });
});
