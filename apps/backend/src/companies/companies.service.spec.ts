import { CompaniesService } from './companies.service';

const prismaMock = {
  company: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  collaborator: {
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
} as any;

const companyLinkingServiceMock = {
  notifyCollaboratorUnlinked: jest.fn(),
} as any;

describe('CompaniesService', () => {
  let service: CompaniesService;
  const userId = 'user-1';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompaniesService(prismaMock, companyLinkingServiceMock);
  });

  describe('findAll()', () => {
    it('maps _count.companyAdmins > 0 to hasActiveAdmin: true', async () => {
      prismaMock.company.findMany.mockResolvedValueOnce([
        {
          id: 'company-1',
          company: 'Acme',
          _count: { workHours: 3, invoices: 1, companyAdmins: 2 },
        },
      ]);

      const result = await service.findAll(userId);

      expect(result).toEqual([
        {
          id: 'company-1',
          company: 'Acme',
          _count: { workHours: 3, invoices: 1 },
          hasActiveAdmin: true,
        },
      ]);
    });

    it('maps _count.companyAdmins === 0 to hasActiveAdmin: false', async () => {
      prismaMock.company.findMany.mockResolvedValueOnce([
        {
          id: 'company-2',
          company: 'Beta',
          _count: { workHours: 0, invoices: 0, companyAdmins: 0 },
        },
      ]);

      const result = await service.findAll(userId);

      expect(result).toEqual([
        {
          id: 'company-2',
          company: 'Beta',
          _count: { workHours: 0, invoices: 0 },
          hasActiveAdmin: false,
        },
      ]);
    });
  });

  describe('findOne()', () => {
    it('includes hasActiveAdmin on a single company', async () => {
      prismaMock.company.findFirst.mockResolvedValueOnce({
        id: 'company-1',
        company: 'Acme',
        _count: { workHours: 3, invoices: 1, companyAdmins: 1 },
      });

      const result = await service.findOne(userId, 'company-1');

      expect(result.hasActiveAdmin).toBe(true);
      expect(result._count).toEqual({ workHours: 3, invoices: 1 });
    });
  });
});
