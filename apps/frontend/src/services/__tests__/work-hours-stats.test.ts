import { renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { useWorkHoursStats } from "../work-hours-stats";

// Mock axios
jest.mock("@/lib/axios", () => ({
  default: {
    get: jest.fn(),
  },
}));

describe("Work Hours Stats Service", () => {
  it("should fetch work hours stats", async () => {
    const mockStats = {
      totalHours: 40,
      totalInvoices: 5,
      totalClients: 3,
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStats });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useWorkHoursStats(), {
      wrapper: ({ children }) => {
        return children;
      },
    });

    expect(api.get).toHaveBeenCalledWith("/work-hours/stats");
  });
});
