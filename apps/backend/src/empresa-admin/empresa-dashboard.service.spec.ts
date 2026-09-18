import { EmpresaDashboardService } from './empresa-dashboard.service';

const prismaMock = {
  colaborador: {
    findMany: jest.fn(),
  },
  convitePendente: {
    count: jest.fn(),
  },
  workHour: {
    findMany: jest.fn(),
  },
  invoice: {
    aggregate: jest.fn(),
  },
} as any;

describe('EmpresaDashboardService', () => {
  let service: EmpresaDashboardService;
  const empresaId = 'empresa-1';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new EmpresaDashboardService(prismaMock);
  });

  describe('resolvePeriod()', () => {
    it('defaults to the current month when from/to are not given', () => {
      const period = service.resolvePeriod();
      const now = new Date();

      expect(period.from.getFullYear()).toBe(now.getFullYear());
      expect(period.from.getMonth()).toBe(now.getMonth());
      expect(period.from.getDate()).toBe(1);

      expect(period.to.getFullYear()).toBe(now.getFullYear());
      expect(period.to.getMonth()).toBe(now.getMonth());
    });

    it('uses the given from/to, with `to` extended to end of day', () => {
      const period = service.resolvePeriod('2026-01-01', '2026-01-31');

      expect(period.from.toISOString().slice(0, 10)).toBe('2026-01-01');
      expect(period.to.getHours()).toBe(23);
      expect(period.to.getMinutes()).toBe(59);
    });
  });

  describe('getOverview()', () => {
    it('sums hours from WorkHour and faturado from Invoice across multiple Colaboradores', async () => {
      prismaMock.colaborador.findMany.mockResolvedValueOnce([
        { id: 'c1', userId: 'user-1', empresaId },
        { id: 'c2', userId: 'user-2', empresaId },
      ]);
      prismaMock.convitePendente.count.mockResolvedValueOnce(3);
      prismaMock.workHour.findMany.mockResolvedValueOnce([
        { hours: 2, projectId: 'p1' },
        { hours: 3, projectId: null },
      ]);
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: 350 },
      });

      const result = await service.getOverview(empresaId);

      expect(result.colaboradoresAtivos).toBe(2);
      expect(result.horasPeriodo).toBe(5);
      expect(result.totalFaturado).toBe(350);
      expect(result.convitesPendentes).toBe(3);

      expect(prismaMock.workHour.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: empresaId,
            userId: { in: ['user-1', 'user-2'] },
          }),
        }),
      );

      expect(prismaMock.invoice.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: empresaId,
            status: { not: 'CANCELED' },
            invoiceWorkHours: {
              some: { workHour: { userId: { in: ['user-1', 'user-2'] } } },
            },
          }),
        }),
      );
    });

    it('returns zeroed stats and skips the WorkHour/Invoice queries when there are no Colaboradores', async () => {
      prismaMock.colaborador.findMany.mockResolvedValueOnce([]);
      prismaMock.convitePendente.count.mockResolvedValueOnce(0);

      const result = await service.getOverview(empresaId);

      expect(result.colaboradoresAtivos).toBe(0);
      expect(result.horasPeriodo).toBe(0);
      expect(result.totalFaturado).toBe(0);
      expect(prismaMock.workHour.findMany).not.toHaveBeenCalled();
      expect(prismaMock.invoice.aggregate).not.toHaveBeenCalled();
    });

    it('falls back to 0 when no invoice matches the period', async () => {
      prismaMock.colaborador.findMany.mockResolvedValueOnce([
        { id: 'c1', userId: 'user-1', empresaId },
      ]);
      prismaMock.convitePendente.count.mockResolvedValueOnce(0);
      prismaMock.workHour.findMany.mockResolvedValueOnce([
        { hours: 4, projectId: null },
      ]);
      prismaMock.invoice.aggregate.mockResolvedValueOnce({
        _sum: { amount: null },
      });

      const result = await service.getOverview(empresaId);

      expect(result.horasPeriodo).toBe(4);
      expect(result.totalFaturado).toBe(0);
    });
  });

  describe('getColaboradoresTable()', () => {
    it('computes horas/projetos from WorkHour and faturado from Invoice, independently per Colaborador', async () => {
      prismaMock.colaborador.findMany.mockResolvedValueOnce([
        {
          id: 'c1',
          userId: 'user-1',
          empresaId,
          origin: 'CONVITE',
          user: { id: 'user-1', name: 'Ana', email: 'ana@test.local' },
        },
        {
          id: 'c2',
          userId: 'user-2',
          empresaId,
          origin: 'DOMINIO',
          user: { id: 'user-2', name: 'Bruno', email: 'bruno@test.local' },
        },
      ]);

      prismaMock.workHour.findMany
        .mockResolvedValueOnce([
          { hours: 2, projectId: 'p1' },
          { hours: 1, projectId: 'p1' },
          { hours: 3, projectId: 'p2' },
        ])
        .mockResolvedValueOnce([{ hours: 5, projectId: null }]);

      prismaMock.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 360 } })
        .mockResolvedValueOnce({ _sum: { amount: 100 } });

      const rows = await service.getColaboradoresTable(empresaId);

      expect(rows).toEqual([
        {
          id: 'c1',
          userId: 'user-1',
          name: 'Ana',
          email: 'ana@test.local',
          origin: 'CONVITE',
          horas: 6,
          projetos: 2,
          faturado: 360,
        },
        {
          id: 'c2',
          userId: 'user-2',
          name: 'Bruno',
          email: 'bruno@test.local',
          origin: 'DOMINIO',
          horas: 5,
          projetos: 0,
          faturado: 100,
        },
      ]);

      expect(prismaMock.invoice.aggregate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceWorkHours: { some: { workHour: { userId: { in: ['user-1'] } } } },
          }),
        }),
      );
      expect(prismaMock.invoice.aggregate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceWorkHours: { some: { workHour: { userId: { in: ['user-2'] } } } },
          }),
        }),
      );
    });

    it('returns an empty list when the Empresa has no Colaboradores', async () => {
      prismaMock.colaborador.findMany.mockResolvedValueOnce([]);

      const rows = await service.getColaboradoresTable(empresaId);

      expect(rows).toEqual([]);
      expect(prismaMock.workHour.findMany).not.toHaveBeenCalled();
      expect(prismaMock.invoice.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('exportCsv()', () => {
    it('renders a header row plus one row per Colaborador, mapping origin to a label', async () => {
      prismaMock.colaborador.findMany.mockResolvedValueOnce([
        {
          id: 'c1',
          userId: 'user-1',
          empresaId,
          origin: 'CONVITE',
          user: { id: 'user-1', name: 'Ana', email: 'ana@test.local' },
        },
        {
          id: 'c2',
          userId: 'user-2',
          empresaId,
          origin: null,
          user: { id: 'user-2', name: 'Carlos', email: 'carlos@test.local' },
        },
      ]);
      prismaMock.workHour.findMany
        .mockResolvedValueOnce([{ hours: 2, projectId: null }])
        .mockResolvedValueOnce([]);
      prismaMock.invoice.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 40 } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const csv = await service.exportCsv(empresaId);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Colaborador,Email,Vinculo,Horas,Projetos,Faturado');
      expect(lines[1]).toBe('Ana,ana@test.local,Convite,2.00,0,40.00');
      expect(lines[2]).toBe('Carlos,carlos@test.local,,0.00,0,0.00');
    });
  });
});
