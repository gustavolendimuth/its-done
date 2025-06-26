import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

import { api } from "@/lib/axios";

import {
  useProfile,
  useUpdateProfile,
  useUpdateProfileAvatar,
  useDeleteProfileAvatar,
  useUpdateProfilePreferences,
  type Profile,
} from "../profile";

// Mock axios
jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({}),
    patch: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
}));

// Mock data
const mockProfile: Profile = {
  id: "1",
  userId: "user1",
  firstName: "John",
  lastName: "Doe",
  avatar: "https://example.com/avatar.jpg",
  phone: "+1234567890",
  address: "123 Main St",
  bio: "Software Developer",
  preferences: {
    theme: "dark",
    language: "en",
    timezone: "UTC",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  },
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
};

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

TestWrapper.displayName = "TestWrapper";

describe("Profile Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useProfile", () => {
    it("should fetch profile data", async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockProfile });

      const { result } = renderHook(() => useProfile(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith("/profile");
      expect(result.current.data).toEqual(mockProfile);
    });

    it("should handle error", async () => {
      const error = new Error("Failed to fetch profile");
      (api.get as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useProfile(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(api.get).toHaveBeenCalledWith("/profile");
      expect(result.current.error).toBeDefined();
    });
  });

  describe("useUpdateProfile", () => {
    it("should update profile data", async () => {
      const updateData = {
        firstName: "Jane",
        lastName: "Smith",
      };

      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockProfile, ...updateData },
      });

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: TestWrapper,
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.patch).toHaveBeenCalledWith("/profile", updateData);
    });
  });

  describe("useUpdateProfileAvatar", () => {
    it("should update profile avatar", async () => {
      const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("avatar", file);

      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { ...mockProfile, avatar: "https://example.com/new-avatar.jpg" },
      });

      const { result } = renderHook(() => useUpdateProfileAvatar(), {
        wrapper: TestWrapper,
      });

      result.current.mutate(file);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.post).toHaveBeenCalledWith(
        "/profile/avatar",
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    });
  });

  describe("useDeleteProfileAvatar", () => {
    it("should delete profile avatar", async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        data: { ...mockProfile, avatar: null },
      });

      const { result } = renderHook(() => useDeleteProfileAvatar(), {
        wrapper: TestWrapper,
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.delete).toHaveBeenCalledWith("/profile/avatar");
    });
  });

  describe("useUpdateProfilePreferences", () => {
    it("should update profile preferences", async () => {
      const newPreferences = {
        theme: "light" as const,
        language: "es",
        timezone: "GMT",
        notifications: {
          email: false,
          push: true,
          sms: true,
        },
      };

      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockProfile, preferences: newPreferences },
      });

      const { result } = renderHook(() => useUpdateProfilePreferences(), {
        wrapper: TestWrapper,
      });

      result.current.mutate(newPreferences);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.patch).toHaveBeenCalledWith("/profile/preferences", {
        preferences: newPreferences,
      });
    });
  });
});
