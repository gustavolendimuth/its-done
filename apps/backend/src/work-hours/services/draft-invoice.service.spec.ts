import { DraftInvoiceService } from './draft-invoice.service';

const prismaMock = {
  invoice: {
    create: jest.fn(),
  },
} as any;

describe('DraftInvoiceService - createDraft()', () => {
  let service: DraftInvoiceService;
  const userId = 'user-1';
  const clientId = 'client-1';

  beforeEach(() => {
    jest.resetAllMocks();
    service = new DraftInvoiceService(prismaMock);
  });

  it('uses the project hourly rate when available', async () => {
    prismaMock.invoice.create.mockResolvedValueOnce({ id: 'inv1' });

    await service.createDraft(userId, clientId, [
      {
        id: 'wh1',
        hours: 2,
        project: { hourlyRate: 100 },
        client: { hourlyRate: 40 },
      },
    ]);

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 200 }),
      }),
    );
  });

  it("falls back to the client's default rate when there is no project", async () => {
    prismaMock.invoice.create.mockResolvedValueOnce({ id: 'inv2' });

    await service.createDraft(userId, clientId, [
      { id: 'wh1', hours: 3, project: null, client: { hourlyRate: 40 } },
    ]);

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 120 }),
      }),
    );
  });

  it('computes 0 when neither project nor client have a rate', async () => {
    prismaMock.invoice.create.mockResolvedValueOnce({ id: 'inv3' });

    await service.createDraft(userId, clientId, [
      { id: 'wh1', hours: 5, project: null, client: { hourlyRate: null } },
    ]);

    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 0 }) }),
    );
  });
});
