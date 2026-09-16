import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";

export interface Task {
  id: string;
  title: string;
  link?: string;
  clientId: string;
  projectId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name?: string;
    email: string;
    company: string;
  };
  project?: {
    id: string;
    name: string;
  } | null;
  /** Sum of actual hours worked across this task's entries. */
  totalHours?: number;
}

export interface CreateTaskData {
  title: string;
  link?: string;
  clientId: string;
  projectId?: string;
}

export interface UpdateTaskData {
  title?: string;
  link?: string;
  clientId?: string;
  projectId?: string;
}

// React Query hooks for tasks
export const useTasks = (clientId?: string) => {
  return useQuery({
    queryKey: ["tasks", clientId],
    queryFn: async () => {
      const params = clientId ? { clientId } : {};
      const { data } = await api.get<Task[]>("/tasks", { params });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/tasks/${id}`);

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const response = await api.post<Task>("/tasks", data);

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", data.clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTaskData;
    }) => {
      const response = await api.patch<Task>(`/tasks/${id}`, data);

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", data.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", data.clientId] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
  });
};
