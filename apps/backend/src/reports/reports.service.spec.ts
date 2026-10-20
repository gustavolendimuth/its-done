import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('filters the hours report by companyId and returns companyBreakdown', async () => {
    const date = new Date('2026-09-01T12:00:00.000Z');
    const prisma = {
      workHour: {
        findMany: jest.fn().mockResolvedValue([
          {
            companyId: 'company-1',
            company: { name: 'Acme' },
            hours: 2,
            date,
          },
        ]),
      },
      invoice: { findMany: jest.fn() },
    };
    const service = new ReportsService(prisma as never);

    const report = await service.generateHoursReport('user-1', {
      companyId: 'company-1',
    });

    expect(prisma.workHour.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', companyId: 'company-1' },
      }),
    );
    expect(report.companyBreakdown).toEqual([
      {
        companyId: 'company-1',
        companyName: 'Acme',
        totalHours: 2,
        percentage: 100,
      },
    ]);
    expect(report).not.toHaveProperty('clientBreakdown');
  });

  it('filters the invoice report by companyId and returns companyBreakdown', async () => {
    const prisma = {
      workHour: { findMany: jest.fn() },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            companyId: 'company-1',
            company: { name: 'Acme' },
            status: 'PAID',
          },
        ]),
      },
    };
    const service = new ReportsService(prisma as never);

    const report = await service.generateInvoiceReport('user-1', {
      companyId: 'company-1',
    });

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-1' }),
      }),
    );
    expect(report.companyBreakdown).toEqual([
      {
        companyId: 'company-1',
        companyName: 'Acme',
        totalInvoices: 1,
        pendingInvoices: 0,
        paidInvoices: 1,
      },
    ]);
    expect(report).not.toHaveProperty('clientBreakdown');
  });
});
