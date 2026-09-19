import { BadRequestException, ConflictException } from '@nestjs/common';

import { DominiosAutorizadosService } from './dominios-autorizados.service';

const prismaMock = {
  dominioAutorizado: {
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

describe('DominiosAutorizadosService', () => {
  let service: DominiosAutorizadosService;
  const empresaId = 'empresa-1';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new DominiosAutorizadosService(
      prismaMock,
      jwtServiceMock,
      notificationsServiceMock,
    );
  });

  describe('create() — public provider domain blocklist', () => {
    it('rejects a well-known public provider domain', async () => {
      await expect(service.create(empresaId, 'gmail.com')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.dominioAutorizado.create).not.toHaveBeenCalled();
    });

    it('rejects the same domain written in uppercase', async () => {
      await expect(service.create(empresaId, 'GMAIL.COM')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.dominioAutorizado.create).not.toHaveBeenCalled();
    });

    it('rejects a subdomain of a blocked provider', async () => {
      await expect(
        service.create(empresaId, 'mail.gmail.com'),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.dominioAutorizado.create).not.toHaveBeenCalled();
    });

    it('rejects a mixed-case subdomain of a blocked provider', async () => {
      await expect(
        service.create(empresaId, 'Mail.GMAIL.com'),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.dominioAutorizado.create).not.toHaveBeenCalled();
    });

    it('does NOT reject a domain that merely contains a blocked name as a substring', async () => {
      prismaMock.dominioAutorizado.findUnique.mockResolvedValueOnce(null);
      prismaMock.dominioAutorizado.create.mockResolvedValueOnce({
        id: 'dom-1',
        empresaId,
        domain: 'notgmail.com',
        status: 'PENDING',
      });

      await expect(
        service.create(empresaId, 'notgmail.com'),
      ).resolves.toMatchObject({ domain: 'notgmail.com' });
      expect(prismaMock.dominioAutorizado.create).toHaveBeenCalledWith({
        data: { empresaId, domain: 'notgmail.com' },
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
        await expect(service.create(empresaId, domain)).rejects.toThrow(
          BadRequestException,
        );
      }
      expect(prismaMock.dominioAutorizado.create).not.toHaveBeenCalled();
    });

    it('rejects a malformed domain', async () => {
      await expect(service.create(empresaId, 'not a domain')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.dominioAutorizado.create).not.toHaveBeenCalled();
    });
  });

  describe('create() — duplicates', () => {
    it('rejects a domain already active (PENDING/CONFIRMED) for this Empresa', async () => {
      prismaMock.dominioAutorizado.findUnique.mockResolvedValueOnce({
        id: 'dom-1',
        empresaId,
        domain: 'acme.com',
        status: 'PENDING',
      });

      await expect(service.create(empresaId, 'acme.com')).rejects.toThrow(
        ConflictException,
      );
      expect(prismaMock.dominioAutorizado.create).not.toHaveBeenCalled();
    });

    it('reactivates a previously revoked domain instead of erroring', async () => {
      prismaMock.dominioAutorizado.findUnique.mockResolvedValueOnce({
        id: 'dom-1',
        empresaId,
        domain: 'acme.com',
        status: 'REVOKED',
      });
      prismaMock.dominioAutorizado.update.mockResolvedValueOnce({
        id: 'dom-1',
        empresaId,
        domain: 'acme.com',
        status: 'PENDING',
      });

      const result = await service.create(empresaId, 'acme.com');

      expect(prismaMock.dominioAutorizado.update).toHaveBeenCalledWith({
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
        empresaId,
        actorType: 'EMPRESA_ADMIN',
        type: 'domain-confirmation',
      });
      prismaMock.dominioAutorizado.findUnique.mockResolvedValueOnce({
        id: 'dom-1',
        empresaId,
        domain: 'acme.com',
        status: 'PENDING',
      });
      prismaMock.dominioAutorizado.update.mockResolvedValueOnce({
        id: 'dom-1',
        empresaId,
        domain: 'acme.com',
        status: 'CONFIRMED',
      });

      const result = await service.confirm('a-valid-token');

      expect(prismaMock.dominioAutorizado.update).toHaveBeenCalledWith({
        where: { id: 'dom-1' },
        data: { status: 'CONFIRMED', confirmedAt: expect.any(Date) },
      });
      expect(result.status).toBe('CONFIRMED');
    });

    it('rejects a token for the wrong actor type', async () => {
      jwtServiceMock.verify.mockReturnValueOnce({
        sub: 'dom-1',
        empresaId,
        actorType: 'USER',
        type: 'domain-confirmation',
      });

      await expect(service.confirm('bad-token')).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.dominioAutorizado.update).not.toHaveBeenCalled();
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
