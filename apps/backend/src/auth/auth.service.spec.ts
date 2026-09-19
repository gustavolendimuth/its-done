import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

const usersServiceMock = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
} as any;

const jwtServiceMock = {
  sign: jest.fn(),
} as any;

const notificationsServiceMock = {
  sendWelcomeEmail: jest.fn(),
} as any;

const companyLinkingServiceMock = {
  syncAutoLinks: jest.fn(),
} as any;

const companyAdminsServiceMock = {
  findByEmail: jest.fn(),
} as any;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthService(
      usersServiceMock,
      jwtServiceMock,
      notificationsServiceMock,
      companyLinkingServiceMock,
      companyAdminsServiceMock,
    );
  });

  describe('register()', () => {
    it('rejects an email that already belongs to a CompanyAdmin', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(null);
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'shared@test.local',
      });

      await expect(
        service.register({
          name: 'Test User',
          email: 'shared@test.local',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe('googleAuth()', () => {
    it('rejects creating a User for an email that already belongs to a CompanyAdmin', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(null);
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'admin-1',
        email: 'shared@test.local',
      });

      await expect(
        service.googleAuth({
          email: 'shared@test.local',
          name: 'Test User',
          googleId: 'google-1',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersServiceMock.create).not.toHaveBeenCalled();
    });
  });
});
