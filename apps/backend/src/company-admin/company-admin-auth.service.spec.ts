import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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

const usersServiceMock = {
  findByEmail: jest.fn(),
} as any;

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
      usersServiceMock,
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

  describe('register()', () => {
    it('register rejects an email that already belongs to a User', async () => {
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce(null);
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'shared@test.local',
      });

      await expect(
        service.register({
          company: 'Acme',
          email: 'shared@test.local',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmCompanyActivation()', () => {
    it('activation confirmation rejects an email that already belongs to a User', async () => {
      jwtServiceMock.verify.mockReturnValueOnce({
        companyId: 'company-1',
        email: 'shared@test.local',
        type: 'company-activation',
      });
      prismaMock.company = {
        findUnique: jest.fn().mockResolvedValueOnce({
          id: 'company-1',
          company: 'Acme',
        }),
      };
      prismaMock.companyAdmin = {
        count: jest.fn().mockResolvedValueOnce(0),
      };
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce(null);
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'shared@test.local',
      });

      await expect(
        service.confirmCompanyActivation({
          token: 'activation-token',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('inviteCompanyAdmin()', () => {
    it('admin invite rejects an email that already belongs to a User', async () => {
      prismaMock.company = {
        findUnique: jest.fn().mockResolvedValueOnce({
          id: 'company-1',
          company: 'Acme',
        }),
      };
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce(null);
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'shared@test.local',
      });

      await expect(
        service.inviteCompanyAdmin(
          { id: 'admin-1', companyId: 'company-1' },
          { email: 'shared@test.local' },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirmCompanyAdminInvite()', () => {
    it('invite confirmation rejects an email that already belongs to a User', async () => {
      jwtServiceMock.verify.mockReturnValueOnce({
        companyId: 'company-1',
        email: 'shared@test.local',
        invitedById: 'admin-1',
        type: 'company-admin-invite',
      });
      prismaMock.company = {
        findUnique: jest.fn().mockResolvedValueOnce({
          id: 'company-1',
          company: 'Acme',
        }),
      };
      companyAdminsServiceMock.findByEmail.mockResolvedValueOnce(null);
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'shared@test.local',
      });

      await expect(
        service.confirmCompanyAdminInvite({
          token: 'invite-token',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    describe('token, company and email checks', () => {
      const validPayload = {
        companyId: 'company-1',
        email: 'invitee@test.local',
        invitedById: 'admin-1',
        type: 'company-admin-invite',
      };
      const dto = { token: 'invite-token', password: 'password123' };

      const tokenError = (name: string) =>
        Object.assign(new Error(name), { name });

      beforeEach(() => {
        prismaMock.company = {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'company-1', company: 'Acme' }),
        };
        prismaMock.companyAdmin = { create: jest.fn() };
        companyAdminsServiceMock.findByEmail.mockResolvedValue(null);
        usersServiceMock.findByEmail.mockResolvedValue(null);
      });

      it('creates the second admin linked to the inviter and returns a session', async () => {
        jwtServiceMock.verify.mockReturnValueOnce(validPayload);
        prismaMock.companyAdmin.create.mockResolvedValueOnce({
          id: 'admin-2',
          email: 'invitee@test.local',
          companyId: 'company-1',
        });
        jwtServiceMock.sign.mockReturnValueOnce('session-token');

        const result = await service.confirmCompanyAdminInvite(dto);

        expect(prismaMock.companyAdmin.create).toHaveBeenCalledWith({
          data: {
            companyId: 'company-1',
            email: 'invitee@test.local',
            password: expect.stringMatching(/^\$2[aby]\$/),
            invitedById: 'admin-1',
          },
        });
        expect(result).toEqual({
          access_token: 'session-token',
          admin: {
            id: 'admin-2',
            email: 'invitee@test.local',
            companyId: 'company-1',
          },
        });
      });

      it('rejects with 409 when the email already belongs to a CompanyAdmin (token used twice)', async () => {
        jwtServiceMock.verify.mockReturnValueOnce(validPayload);
        companyAdminsServiceMock.findByEmail.mockResolvedValueOnce({
          id: 'admin-2',
        });

        await expect(service.confirmCompanyAdminInvite(dto)).rejects.toThrow(
          'An CompanyAdmin already exists with this email',
        );
        expect(prismaMock.companyAdmin.create).not.toHaveBeenCalled();
      });

      it('rejects with 404 when the invited company no longer exists', async () => {
        jwtServiceMock.verify.mockReturnValueOnce(validPayload);
        prismaMock.company.findUnique.mockResolvedValueOnce(null);

        await expect(service.confirmCompanyAdminInvite(dto)).rejects.toThrow(
          NotFoundException,
        );
        expect(prismaMock.companyAdmin.create).not.toHaveBeenCalled();
      });

      it('rejects a token of another type (activation token on the invite endpoint)', async () => {
        jwtServiceMock.verify.mockReturnValueOnce({
          ...validPayload,
          type: 'company-activation',
        });

        await expect(service.confirmCompanyAdminInvite(dto)).rejects.toThrow(
          new BadRequestException('Invalid token'),
        );
        expect(prismaMock.companyAdmin.create).not.toHaveBeenCalled();
      });

      it('rejects an expired token', async () => {
        jwtServiceMock.verify.mockImplementationOnce(() => {
          throw tokenError('TokenExpiredError');
        });

        await expect(service.confirmCompanyAdminInvite(dto)).rejects.toThrow(
          new BadRequestException('Token has expired'),
        );
      });

      it('rejects a token with a bad signature', async () => {
        jwtServiceMock.verify.mockImplementationOnce(() => {
          throw tokenError('JsonWebTokenError');
        });

        await expect(service.confirmCompanyAdminInvite(dto)).rejects.toThrow(
          new BadRequestException('Invalid token'),
        );
      });
    });
  });
});
