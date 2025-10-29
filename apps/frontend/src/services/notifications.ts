import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationDto extends Partial<CreateNotificationDto> {
  read?: boolean;
}

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>("/notifications");

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>("/notifications/unread");

      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ["notifications", "unread", "count"],
    queryFn: async () => {
      const { data } = await api.get<number>("/notifications/unread/count");

      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useNotification = (id: string) => {
  return useQuery({
    queryKey: ["notifications", id],
    queryFn: async () => {
      const { data } = await api.get<Notification>(`/notifications/${id}`);

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotificationDto) => {
      const response = await api.post<Notification>("/notifications", data);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateNotificationDto;
    }) => {
      const response = await api.patch<Notification>(
        `/notifications/${id}`,
        data
      );

      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", id] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Notification>(`/notifications/${id}`);

      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", id] });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Notification>(
        `/notifications/${id}/mark-as-read`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<void>("/notifications/mark-all-as-read");

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
