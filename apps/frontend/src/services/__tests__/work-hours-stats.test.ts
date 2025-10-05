import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import api from "@/lib/axios";
import { useWorkHoursStats } from "../work-hours-stats";

// Mock axios
jest.mock("@/lib/axios");

const mockedApi = api as jest.Mocked<typeof api>;

describe("Work Hours Stats Service", () => {
  it("should fetch work hours stats", async () => {
    const mockStats = {
      totalHours: 40,
      totalInvoices: 5,
      totalClients: 3,
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockStats });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const { result } = renderHook(() => useWorkHoursStats(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith("/work-hours/stats");
  });
});
