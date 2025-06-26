import { renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { useProfile } from "../profile";

// Mock axios
jest.mock("@/lib/axios", () => ({
  default: {
    get: jest.fn(),
  },
}));

describe("Profile Service", () => {
  it("should fetch profile data", async () => {
    const mockProfile = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockProfile });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useProfile(), {
      wrapper: ({ children }) => {
        return children;
      },
    });

    expect(api.get).toHaveBeenCalledWith("/profile");
  });

  // ... rest of the tests ...
});
