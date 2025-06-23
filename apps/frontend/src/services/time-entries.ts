import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { getApiUrl } from "@/lib/utils";

const API_URL = getApiUrl();

export interface TimeEntry {
  id: string;
  date: string;
  description?: string;
  hours: number;
  clientId: string;
  projectId?: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  invoiceWorkHours?: {
    invoice: {
      id: string;
      status: string;
      number?: string;
      createdAt: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryDto {
  date: string;
  description?: string;
  hours: number;
  clientId: string;
  projectId?: string;
}

export interface UpdateTimeEntryDto extends Partial<CreateTimeEntryDto> {}

export const useTimeEntries = (params?: {
  from?: string;
  to?: string;
  clientId?: string;
}) => {
  return useQuery({
    queryKey: ["timeEntries", params],
    queryFn: async () => {
      const { data } = await api.get<TimeEntry[]>("/work-hours", {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      // Invalidate all time entries queries
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      // Invalidate work hours stats
      queryClient.invalidateQueries({ queryKey: ["workHours", "stats"] });
      // Invalidate client stats
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
      data: UpdateTimeEntryDto;
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
