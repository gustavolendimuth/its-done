import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
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
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries", id] });
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
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries", id] });
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
  });
};
