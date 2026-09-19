import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import api from "@/lib/axios";
import {
  type HoursReport,
  type InvoiceReport,
  useHoursReport,
  useInvoiceReport,
} from "./reports.service";

jest.mock("@/lib/axios");

const mockedApi = api as jest.Mocked<typeof api>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("analytics report contracts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends companyId in the hours report query", async () => {
    const report: HoursReport = {
      totalHours: 2,
      totalDays: 1,
      averageHoursPerDay: 2,
      companyBreakdown: [
        {
          companyId: "company-1",
          companyName: "Acme",
          totalHours: 2,
          percentage: 100,
        },
      ],
      weeklyBreakdown: [],
      monthlyBreakdown: [],
    };
    mockedApi.get.mockResolvedValueOnce({ data: report });

    const { result } = renderHook(
      () => useHoursReport({ companyId: "company-1" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/reports/hours?companyId=company-1",
    );
    expect(result.current.data?.companyBreakdown[0].companyName).toBe("Acme");
  });

  it("sends companyId and consumes companyBreakdown in the invoice report", async () => {
    const report: InvoiceReport = {
      totalInvoices: 1,
      pendingInvoices: 0,
      paidInvoices: 1,
      companyBreakdown: [
        {
          companyId: "company-1",
          companyName: "Acme",
          totalInvoices: 1,
          pendingInvoices: 0,
          paidInvoices: 1,
        },
      ],
    };
    mockedApi.get.mockResolvedValueOnce({ data: report });

    const { result } = renderHook(
      () => useInvoiceReport({ companyId: "company-1" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/reports/invoices?companyId=company-1",
    );
    expect(result.current.data?.companyBreakdown[0].companyName).toBe("Acme");
  });
});
