import { BadRequestException, ConflictException } from '@nestjs/common';

import { AuthorizedDomainsService } from './authorized-domains.service';

const prismaMock = {
  authorizedDomain: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as any;

const jwtServiceMock = {
  sign: jest.fn(),
  verify: jest.fn(),
} as any;

const notificationsServiceMock = {
  sendPasswordResetEmail: jest.fn(),
} as any;

describe('AuthorizedDomainsService', () => {
  let service: AuthorizedDomainsService;
  const companyId = 'company-1';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthorizedDomainsService(
      prismaMock,
      jwtServiceMock,
      notificationsServiceMock,
    );
  });

  describe('create() — public provider domain blocklist', () => {
    it('rejects a well-known public provider domain', async () => {
      await expect(service.create(companyId, 'gmail.com')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.authorizedDomain.create).not.toHaveBeenCalled();
    });

    it('rejects the same domain written in uppercase', async () => {
      await expect(service.create(companyId, 'GMAIL.COM')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.authorizedDomain.create).not.toHaveBeenCalled();
    });

    it('rejects a subdomain of a blocked provider', async () => {
      await expect(
        service.create(companyId, 'mail.gmail.com'),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.authorizedDomain.create).not.toHaveBeenCalled();
    });

    it('rejects a mixed-case subdomain of a blocked provider', async () => {
      await expect(
        service.create(companyId, 'Mail.GMAIL.com'),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.authorizedDomain.create).not.toHaveBeenCalled();
    });

    it('does NOT reject a domain that merely contains a blocked name as a substring', async () => {
      prismaMock.authorizedDomain.findUnique.mockResolvedValueOnce(null);
      prismaMock.authorizedDomain.create.mockResolvedValueOnce({
        id: 'dom-1',
        companyId,
        domain: 'notgmail.com',
        status: 'PENDING',
      });

      await expect(
        service.create(companyId, 'notgmail.com'),
      ).resolves.toMatchObject({ domain: 'notgmail.com' });
      expect(prismaMock.authorizedDomain.create).toHaveBeenCalledWith({
        data: { companyId, domain: 'notgmail.com' },
      });
    });

    it('rejects every domain in the minimum blocklist', async () => {
      const blocked = [
        'gmail.com',
        'outlook.com',
        'hotmail.com',
        'yahoo.com',
        'icloud.com',
        'live.com',
        'aol.com',
        'protonmail.com',
        'gmx.com',
        'zoho.com',
      ];

      for (const domain of blocked) {
        await expect(service.create(companyId, domain)).rejects.toThrow(
          BadRequestException,
        );
      }
      expect(prismaMock.authorizedDomain.create).not.toHaveBeenCalled();
    });

    it('rejects a malformed domain', async () => {
      await expect(service.create(companyId, 'not a domain')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.authorizedDomain.create).not.toHaveBeenCalled();
    });
  });

  describe('create() — duplicates', () => {
    it('rejects a domain already active (PENDING/CONFIRMED) for this Company', async () => {
      prismaMock.authorizedDomain.findUnique.mockResolvedValueOnce({
        id: 'dom-1',
        companyId,
        domain: 'acme.com',
        status: 'PENDING',
      });

      await expect(service.create(companyId, 'acme.com')).rejects.toThrow(
        ConflictException,
      );
      expect(prismaMock.authorizedDomain.create).not.toHaveBeenCalled();
    });

    it('reactivates a previously revoked domain instead of erroring', async () => {
      prismaMock.authorizedDomain.findUnique.mockResolvedValueOnce({
        id: 'dom-1',
        companyId,
        domain: 'acme.com',
        status: 'REVOKED',
      });
      prismaMock.authorizedDomain.update.mockResolvedValueOnce({
        id: 'dom-1',
        companyId,
        domain: 'acme.com',
        status: 'PENDING',
      });

      const result = await service.create(companyId, 'acme.com');

      expect(prismaMock.authorizedDomain.update).toHaveBeenCalledWith({
        where: { id: 'dom-1' },
        data: { status: 'PENDING', confirmedAt: null },
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('confirm()', () => {
    it('marks a PENDING domain as CONFIRMED with a valid token', async () => {
      jwtServiceMock.verify.mockReturnValueOnce({
        sub: 'dom-1',
        companyId,
        actorType: 'COMPANY_ADMIN',
        type: 'domain-confirmation',
      });
      prismaMock.authorizedDomain.findUnique.mockResolvedValueOnce({
        id: 'dom-1',
        companyId,
        domain: 'acme.com',
        status: 'PENDING',
      });
      prismaMock.authorizedDomain.update.mockResolvedValueOnce({
        id: 'dom-1',
        companyId,
        domain: 'acme.com',
        status: 'CONFIRMED',
      });

      const result = await service.confirm('a-valid-token');

      expect(prismaMock.authorizedDomain.update).toHaveBeenCalledWith({
        where: { id: 'dom-1' },
        data: { status: 'CONFIRMED', confirmedAt: expect.any(Date) },
      });
      expect(result.status).toBe('CONFIRMED');
    });

    it('rejects a token for the wrong actor type', async () => {
      jwtServiceMock.verify.mockReturnValueOnce({
        sub: 'dom-1',
        companyId,
        actorType: 'USER',
        type: 'domain-confirmation',
      });

      await expect(service.confirm('bad-token')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.authorizedDomain.update).not.toHaveBeenCalled();
    });

    it('rejects an expired/invalid token', async () => {
      jwtServiceMock.verify.mockImplementationOnce(() => {
        throw new Error('jwt expired');
      });

      await expect(service.confirm('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
