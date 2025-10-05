import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import api from "@/lib/axios";
import { useProfile } from "../profile";

// Mock axios
jest.mock("@/lib/axios");

const mockedApi = api as jest.Mocked<typeof api>;

describe("Profile Service", () => {
  it("should fetch profile data", async () => {
    const mockProfile = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockProfile });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith("/profile");
  });

  // ... rest of the tests ...
});
