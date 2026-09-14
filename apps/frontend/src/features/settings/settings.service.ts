import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";

export const ALLOWED_ROUNDING_INCREMENTS = [0, 5, 10, 15, 30, 60] as const;
export type RoundingIncrementMinutes =
  (typeof ALLOWED_ROUNDING_INCREMENTS)[number];

export interface Settings {
  id: string;
  alertHours: number;
  notificationEmail?: string;
  roundingIncrementMinutes: RoundingIncrementMinutes;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingsDto {
  alertHours: number;
  notificationEmail?: string;
  roundingIncrementMinutes?: RoundingIncrementMinutes;
}

export interface UpdateSettingsDto extends Partial<CreateSettingsDto> {}

export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get<Settings>("/settings");

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettingsDto) => {
      const response = await api.patch<Settings>("/settings", data);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};

export const useDeleteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete<Settings>("/settings");

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};
