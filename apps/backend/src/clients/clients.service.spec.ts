import { ClientsService } from './clients.service';

const prismaMock = {
  empresa: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  colaborador: {
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
} as any;

const empresaLinkingServiceMock = {
  notifyColaboradorUnlinked: jest.fn(),
} as any;

describe('ClientsService', () => {
  let service: ClientsService;
  const userId = 'user-1';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ClientsService(prismaMock, empresaLinkingServiceMock);
  });

  describe('findAll()', () => {
    it('maps _count.empresaAdmins > 0 to hasActiveAdmin: true', async () => {
      prismaMock.empresa.findMany.mockResolvedValueOnce([
        {
          id: 'empresa-1',
          company: 'Acme',
          _count: { workHours: 3, invoices: 1, empresaAdmins: 2 },
        },
      ]);

      const result = await service.findAll(userId);

      expect(result).toEqual([
        {
          id: 'empresa-1',
          company: 'Acme',
          _count: { workHours: 3, invoices: 1 },
          hasActiveAdmin: true,
        },
      ]);
    });

    it('maps _count.empresaAdmins === 0 to hasActiveAdmin: false', async () => {
      prismaMock.empresa.findMany.mockResolvedValueOnce([
        {
          id: 'empresa-2',
          company: 'Beta',
          _count: { workHours: 0, invoices: 0, empresaAdmins: 0 },
        },
      ]);

      const result = await service.findAll(userId);

      expect(result).toEqual([
        {
          id: 'empresa-2',
          company: 'Beta',
          _count: { workHours: 0, invoices: 0 },
          hasActiveAdmin: false,
        },
      ]);
    });
  });

  describe('findOne()', () => {
    it('includes hasActiveAdmin on a single empresa', async () => {
      prismaMock.empresa.findFirst.mockResolvedValueOnce({
        id: 'empresa-1',
        company: 'Acme',
        _count: { workHours: 3, invoices: 1, empresaAdmins: 1 },
      });

      const result = await service.findOne(userId, 'empresa-1');

      expect(result.hasActiveAdmin).toBe(true);
      expect(result._count).toEqual({ workHours: 3, invoices: 1 });
    });
  });
});
