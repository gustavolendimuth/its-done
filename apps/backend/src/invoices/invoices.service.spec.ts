import { InvoicesService } from './invoices.service';

// Minimal mocks for dependencies
const prismaMock = {
  workHour: {
    findMany: jest.fn(),
  },
  invoiceWorkHour: {
    findMany: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
  },
} as any;

const notificationsMock = {
  sendInvoiceUploadNotification: jest.fn(),
} as any;

const configMock = {
  get: jest.fn(),
} as any;

const uploadMock = {} as any;

describe('InvoicesService - create()', () => {
  let service: InvoicesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new InvoicesService(
      prismaMock,
      notificationsMock,
      configMock,
      uploadMock,
    );
  });

  it('computes amount from project hourly rates when amount is not provided', async () => {
    const userId = 'user-1';
    const dto = {
      workHourIds: ['wh1', 'wh2'],
      // amount omitted to force computation
    } as any;

    prismaMock.workHour.findMany.mockResolvedValueOnce([
      { id: 'wh1', userId, clientId: 'c1', projectId: 'p1', hours: 2 },
      { id: 'wh2', userId, clientId: 'c1', projectId: 'p2', hours: 3 },
    ]);

    prismaMock.invoiceWorkHour.findMany.mockResolvedValueOnce([]);

    prismaMock.project.findMany.mockResolvedValueOnce([
      { id: 'p1', hourlyRate: 100 },
      { id: 'p2', hourlyRate: 80 },
    ]);

    prismaMock.invoice.create.mockResolvedValueOnce({
      id: 'inv1',
      amount: 440,
    });
    prismaMock.client.findUnique.mockResolvedValueOnce({ email: undefined });

    const result = await service.create(dto, userId);

    // Expected computed = 2*100 + 3*80 = 440
    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 440 }),
      }),
    );
    expect(result).toEqual({ id: 'inv1', amount: 440 });
  });

  it("falls back to the client's default hourly rate when a work hour has no project", async () => {
    const userId = 'user-1';
    const dto = { workHourIds: ['wh1', 'wh2'] } as any;

    prismaMock.workHour.findMany.mockResolvedValueOnce([
      { id: 'wh1', userId, clientId: 'c1', projectId: 'p1', hours: 2 },
      { id: 'wh2', userId, clientId: 'c1', projectId: null, hours: 3 },
    ]);
    prismaMock.invoiceWorkHour.findMany.mockResolvedValueOnce([]);
    prismaMock.project.findMany.mockResolvedValueOnce([
      { id: 'p1', hourlyRate: 100 },
    ]);
    prismaMock.client.findUnique.mockResolvedValueOnce({ hourlyRate: 40 });
    prismaMock.invoice.create.mockResolvedValueOnce({ id: 'inv2', amount: 320 });

    await service.create(dto, userId);

    // 2*100 (project rate) + 3*40 (client fallback) = 320
    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 320 }),
      }),
    );
  });

  it('computes 0 when a work hour has neither a project nor a client rate', async () => {
    const userId = 'user-1';
    const dto = { workHourIds: ['wh1'] } as any;

    prismaMock.workHour.findMany.mockResolvedValueOnce([
      { id: 'wh1', userId, clientId: 'c1', projectId: null, hours: 5 },
    ]);
    prismaMock.invoiceWorkHour.findMany.mockResolvedValueOnce([]);
    prismaMock.client.findUnique.mockResolvedValueOnce({ hourlyRate: null });
    prismaMock.invoice.create.mockResolvedValueOnce({ id: 'inv3', amount: 0 });

    await service.create(dto, userId);

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 0 }),
      }),
    );
  });

  it('throws if hours belong to different clients', async () => {
    const userId = 'user-1';
    const dto = { workHourIds: ['wh1', 'wh2'] } as any;

    prismaMock.workHour.findMany.mockResolvedValueOnce([
      { id: 'wh1', userId, clientId: 'c1', projectId: 'p1', hours: 1 },
      { id: 'wh2', userId, clientId: 'c2', projectId: 'p1', hours: 1 },
    ]);
    prismaMock.invoiceWorkHour.findMany.mockResolvedValueOnce([]);

    await expect(service.create(dto, userId)).rejects.toThrow(
      'All work hours must belong to the same client',
    );
  });

  it('prevents reuse of work hours if already invoiced in non-canceled invoices', async () => {
    const userId = 'user-1';
    const dto = { workHourIds: ['wh1'] } as any;

    prismaMock.workHour.findMany.mockResolvedValueOnce([
      { id: 'wh1', userId, clientId: 'c1', projectId: 'p1', hours: 1 },
    ]);

    prismaMock.invoiceWorkHour.findMany.mockResolvedValueOnce([
      {
        workHourId: 'wh1',
        invoice: { id: 'i1', number: '0001', status: 'PENDING' },
      },
    ]);

    await expect(service.create(dto, userId)).rejects.toThrow(
      /already invoiced/i,
    );
  });
});
