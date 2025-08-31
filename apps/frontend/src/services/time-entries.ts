import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";
import { TimeEntry, CreateTimeEntryDto } from "@/types";

export const useTimeEntries = (params?: {
  from?: string;
  to?: string;
  clientId?: string;
}) => {
  console.log("⏰ useTimeEntries called with params:", params);

  return useQuery({
    queryKey: ["timeEntries", params],
    queryFn: async () => {
      console.log("⏰ useTimeEntries fetching data with params:", params);
      const { data } = await api.get<TimeEntry[]>("/work-hours", {
        params,
      });
      console.log("⏰ useTimeEntries received data:", data);
      console.log("⏰ useTimeEntries data length:", data.length);
      return data;
    },
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export const useAvailableTimeEntries = (params?: {
  from?: string;
  to?: string;
  clientId?: string;
}) => {
  return useQuery({
    queryKey: ["timeEntries", "available", params],
    queryFn: async () => {
      const { data } = await api.get<TimeEntry[]>("/work-hours/available", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useTimeEntry = (id: string) => {
  return useQuery({
    queryKey: ["timeEntries", id],
    queryFn: async () => {
      const { data } = await api.get<TimeEntry>(`/work-hours/${id}`);

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimeEntryDto) => {
      const response = await api.post<TimeEntry>("/work-hours", data);

      return response.data;
    },
    onSuccess: () => {
      console.log(
        "🚀 Time entry created successfully, invalidating queries..."
      );

      // Invalidate and immediately refetch active queries
      queryClient.invalidateQueries({
        queryKey: ["timeEntries"],
        refetchType: "active",
      });

      queryClient.invalidateQueries({
        queryKey: ["workHours"],
        refetchType: "active",
      });

      queryClient.invalidateQueries({
        queryKey: ["clients"],
        refetchType: "active",
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
        refetchType: "active",
      });

      console.log(
        "✅ All active queries invalidated and will refetch immediately"
      );
    },
  });
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTimeEntryDto>;
    }) => {
      const response = await api.patch<TimeEntry>(`/work-hours/${id}`, data);

      return response.data;
    },
    onSuccess: (_, { id }) => {
      // Invalidate all time entries queries
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries", id] });
      // Invalidate work hours stats
      queryClient.invalidateQueries({ queryKey: ["workHours", "stats"] });
      // Invalidate client stats
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<TimeEntry>(`/work-hours/${id}`);

      return response.data;
    },
    onSuccess: (_, id) => {
      // Invalidate all time entries queries
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries", id] });
      // Invalidate work hours stats
      queryClient.invalidateQueries({ queryKey: ["workHours", "stats"] });
      // Invalidate client stats
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useTotalHours = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ["timeEntries", "total", startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<{ total: number }>("/work-hours/total", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      return data.total;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
