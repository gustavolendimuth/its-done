import { CompanyAdminAuthService } from './company-admin-auth.service';

const prismaMock = {} as any;

const companyAdminsServiceMock = {
  findByEmail: jest.fn(),
} as any;

const jwtServiceMock = {
  sign: jest.fn(),
  verify: jest.fn(),
} as any;

const notificationsServiceMock = {
  sendCompanyAdminPasswordResetEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
} as any;

const inAppNotificationsServiceMock = {} as any;

describe('CompanyAdminAuthService', () => {
  let service: CompanyAdminAuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyAdminAuthService(
      prismaMock,
      companyAdminsServiceMock,
      jwtServiceMock,
      notificationsServiceMock,
      inAppNotificationsServiceMock,
    );
  });

  describe('forgotPassword()', () => {
    it('calls sendCompanyAdminPasswordResetEmail, not the shared sendPasswordResetEmail', async () => {
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin@test.local',
        companyId: 'company-1',
      });
      jwtServiceMock.sign.mockReturnValueOnce('reset-token');

      await service.forgotPassword({ email: 'admin@test.local' });

      expect(
        notificationsServiceMock.sendCompanyAdminPasswordResetEmail,
      ).toHaveBeenCalledWith(
        'admin@test.local',
        'admin@test.local',
        'reset-token',
      );
      expect(
        notificationsServiceMock.sendPasswordResetEmail,
      ).not.toHaveBeenCalled();
    });
  });
});
