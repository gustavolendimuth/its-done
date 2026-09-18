import { EmpresaAdminAuthService } from './empresa-admin-auth.service';

const prismaMock = {} as any;

const empresaAdminsServiceMock = {
  findByEmail: jest.fn(),
} as any;

const jwtServiceMock = {
  sign: jest.fn(),
  verify: jest.fn(),
} as any;

const notificationsServiceMock = {
  sendEmpresaAdminPasswordResetEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
} as any;

const inAppNotificationsServiceMock = {} as any;

describe('EmpresaAdminAuthService', () => {
  let service: EmpresaAdminAuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new EmpresaAdminAuthService(
      prismaMock,
      empresaAdminsServiceMock,
      jwtServiceMock,
      notificationsServiceMock,
      inAppNotificationsServiceMock,
    );
  });

  describe('forgotPassword()', () => {
    it('calls sendEmpresaAdminPasswordResetEmail, not the shared sendPasswordResetEmail', async () => {
      empresaAdminsServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin@test.local',
        empresaId: 'empresa-1',
      });
      jwtServiceMock.sign.mockReturnValueOnce('reset-token');

      await service.forgotPassword({ email: 'admin@test.local' });

      expect(
        notificationsServiceMock.sendEmpresaAdminPasswordResetEmail,
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
