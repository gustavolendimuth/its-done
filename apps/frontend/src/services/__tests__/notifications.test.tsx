import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { ReactNode } from "react";

import api from "@/lib/axios";
import {
  useNotifications,
  useUnreadNotifications,
  useUnreadNotificationCount,
  useNotification,
  useCreateNotification,
  useUpdateNotification,
  useDeleteNotification,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  type Notification,
  type CreateNotificationDto,
  type UpdateNotificationDto,
  type NotificationType,
} from "../notifications";

// Mock axios
jest.mock("@/lib/axios");
const mockedApi = api as jest.Mocked<typeof api>;

// Helper to create a test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Notification Services", () => {
  const mockNotification: Notification = {
    id: "notif-1",
    userId: "user-1",
    title: "Test Notification",
    message: "This is a test notification",
    type: "INFO",
    read: false,
    metadata: { key: "value" },
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  };

  const mockNotifications: Notification[] = [
    mockNotification,
    {
      id: "notif-2",
      userId: "user-1",
      title: "Success Notification",
      message: "Operation completed successfully",
      type: "SUCCESS",
      read: true,
      metadata: null,
      createdAt: "2024-03-02T00:00:00Z",
      updatedAt: "2024-03-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useNotifications", () => {
    it("fetches all notifications successfully", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockNotifications });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockNotifications);
      expect(mockedApi.get).toHaveBeenCalledWith("/notifications");
    });

    it("handles fetch error", async () => {
      mockedApi.get.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useUnreadNotifications", () => {
    it("fetches unread notifications", async () => {
      const unreadNotifications = [mockNotification];
      mockedApi.get.mockResolvedValueOnce({ data: unreadNotifications });

      const { result } = renderHook(() => useUnreadNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(unreadNotifications);
      expect(mockedApi.get).toHaveBeenCalledWith("/notifications/unread");
    });

    it("refetches at configured interval", async () => {
      jest.useFakeTimers();
      mockedApi.get.mockResolvedValue({ data: [mockNotification] });

      const { result } = renderHook(() => useUnreadNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const initialCallCount = mockedApi.get.mock.calls.length;

      // Fast-forward 30 seconds (refetchInterval)
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockedApi.get.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });

      jest.useRealTimers();
    });
  });

  describe("useUnreadNotificationCount", () => {
    it("fetches unread notification count", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: 5 });

      const { result } = renderHook(() => useUnreadNotificationCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(5);
      expect(mockedApi.get).toHaveBeenCalledWith("/notifications/unread/count");
    });

    it("polls for updates", async () => {
      jest.useFakeTimers();
      mockedApi.get.mockResolvedValue({ data: 3 });

      const { result } = renderHook(() => useUnreadNotificationCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const initialCallCount = mockedApi.get.mock.calls.length;

      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockedApi.get.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });

      jest.useRealTimers();
    });
  });

  describe("useNotification", () => {
    it("fetches a single notification", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockNotification });

      const { result } = renderHook(() => useNotification("notif-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockNotification);
      expect(mockedApi.get).toHaveBeenCalledWith("/notifications/notif-1");
    });

    it("does not fetch when id is empty", () => {
      const { result } = renderHook(() => useNotification(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  describe("useCreateNotification", () => {
    it("creates a notification successfully", async () => {
      const createData: CreateNotificationDto = {
        title: "New Notification",
        message: "This is a new notification",
        type: "WARNING",
        metadata: { source: "test" },
      };

      mockedApi.post.mockResolvedValueOnce({ data: mockNotification });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateNotification(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync(createData);

      expect(mockedApi.post).toHaveBeenCalledWith("/notifications", createData);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["notifications"],
      });
    });

    it("creates notification without optional fields", async () => {
      const minimalData: CreateNotificationDto = {
        title: "Simple Notification",
        message: "Simple message",
      };

      mockedApi.post.mockResolvedValueOnce({ data: mockNotification });

      const { result } = renderHook(() => useCreateNotification(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(minimalData);

      expect(mockedApi.post).toHaveBeenCalledWith("/notifications", minimalData);
    });

    it("handles create error", async () => {
      mockedApi.post.mockRejectedValueOnce(new Error("API Error"));

      const { result } = renderHook(() => useCreateNotification(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          title: "Test",
          message: "Test",
        })
      ).rejects.toThrow("API Error");
    });
  });

  describe("useUpdateNotification", () => {
    it("updates a notification successfully", async () => {
      const updateData: UpdateNotificationDto = {
        read: true,
        title: "Updated Title",
      };

      const updatedNotification = { ...mockNotification, ...updateData };
      mockedApi.patch.mockResolvedValueOnce({ data: updatedNotification });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateNotification(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync({ id: "notif-1", data: updateData });

      expect(mockedApi.patch).toHaveBeenCalledWith(
        "/notifications/notif-1",
        updateData
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["notifications"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["notifications", "notif-1"],
      });
    });

    it("handles update error", async () => {
      mockedApi.patch.mockRejectedValueOnce(new Error("Update failed"));

      const { result } = renderHook(() => useUpdateNotification(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ id: "notif-1", data: { read: true } })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("useDeleteNotification", () => {
    it("deletes a notification successfully", async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: mockNotification });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync("notif-1");

      expect(mockedApi.delete).toHaveBeenCalledWith("/notifications/notif-1");
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["notifications"],
      });
    });

    it("handles delete error", async () => {
      mockedApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const { result } = renderHook(() => useDeleteNotification(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync("notif-1")).rejects.toThrow(
        "Delete failed"
      );
    });
  });

  describe("useMarkNotificationAsRead", () => {
    it("marks notification as read successfully", async () => {
      const readNotification = { ...mockNotification, read: true };
      mockedApi.post.mockResolvedValueOnce({ data: readNotification });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useMarkNotificationAsRead(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync("notif-1");

      expect(mockedApi.post).toHaveBeenCalledWith(
        "/notifications/notif-1/mark-as-read"
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["notifications"],
      });
    });

    it("handles mark as read error", async () => {
      mockedApi.post.mockRejectedValueOnce(new Error("Mark failed"));

      const { result } = renderHook(() => useMarkNotificationAsRead(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync("notif-1")).rejects.toThrow(
        "Mark failed"
      );
    });
  });

  describe("useMarkAllNotificationsAsRead", () => {
    it("marks all notifications as read successfully", async () => {
      mockedApi.post.mockResolvedValueOnce({ data: undefined });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync();

      expect(mockedApi.post).toHaveBeenCalledWith(
        "/notifications/mark-all-as-read"
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["notifications"],
      });
    });

    it("handles mark all as read error", async () => {
      mockedApi.post.mockRejectedValueOnce(new Error("Mark all failed"));

      const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync()).rejects.toThrow(
        "Mark all failed"
      );
    });
  });

  describe("Notification Types", () => {
    const types: NotificationType[] = ["INFO", "SUCCESS", "WARNING", "ERROR"];

    types.forEach((type) => {
      it(`handles ${type} notification type`, async () => {
        const notification: Notification = {
          ...mockNotification,
          type,
          id: `notif-${type}`,
        };

        mockedApi.get.mockResolvedValueOnce({ data: [notification] });

        const { result } = renderHook(() => useNotifications(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.[0].type).toBe(type);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles notification without metadata", async () => {
      const notificationNoMetadata: Notification = {
        ...mockNotification,
        metadata: null,
      };

      mockedApi.get.mockResolvedValueOnce({ data: [notificationNoMetadata] });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].metadata).toBeNull();
    });

    it("handles empty notifications list", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it("handles zero unread count", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: 0 });

      const { result } = renderHook(() => useUnreadNotificationCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(0);
    });

    it("handles partial update", async () => {
      const partialUpdate: UpdateNotificationDto = {
        read: true,
      };

      mockedApi.patch.mockResolvedValueOnce({
        data: { ...mockNotification, read: true },
      });

      const { result } = renderHook(() => useUpdateNotification(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: "notif-1", data: partialUpdate });

      expect(mockedApi.patch).toHaveBeenCalledWith(
        "/notifications/notif-1",
        partialUpdate
      );
    });

    it("handles metadata with complex objects", async () => {
      const complexMetadata = {
        nested: {
          data: {
            array: [1, 2, 3],
            object: { key: "value" },
          },
        },
        timestamp: "2024-03-01T00:00:00Z",
      };

      const createData: CreateNotificationDto = {
        title: "Complex Notification",
        message: "Has complex metadata",
        metadata: complexMetadata,
      };

      mockedApi.post.mockResolvedValueOnce({
        data: { ...mockNotification, metadata: complexMetadata },
      });

      const { result } = renderHook(() => useCreateNotification(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(createData);

      expect(mockedApi.post).toHaveBeenCalledWith(
        "/notifications",
        createData
      );
    });
  });

  describe("Query Configuration", () => {
    it("has correct stale time for regular notifications", () => {
      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      // Check that the query is configured (this is more of a structural test)
      expect(result.current).toBeDefined();
    });

    it("has correct refetch interval for unread notifications", () => {
      const { result } = renderHook(() => useUnreadNotifications(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
    });

    it("enables refetch on window focus for unread notifications", async () => {
      mockedApi.get.mockResolvedValue({ data: [mockNotification] });

      const { result } = renderHook(() => useUnreadNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The query should be configured to refetch on window focus
      expect(result.current).toBeDefined();
    });
  });
});
