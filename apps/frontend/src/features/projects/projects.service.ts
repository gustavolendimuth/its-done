import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";

export interface Project {
  id: string;
  name: string;
  description?: string;
  hourlyRate?: number;
  companyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name?: string;
    email: string;
    company: string;
  };
  _count: {
    workHours: number;
  };
  /** Sum of actual hours worked across this project's entries. */
  totalHours?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  hourlyRate?: number;
  companyId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  hourlyRate?: number;
  companyId?: string;
}

// React Query hooks for projects
export const useProjects = (companyId?: string) => {
  return useQuery({
    queryKey: ["projects", companyId],
    queryFn: async () => {
      const params = companyId ? { companyId } : {};
      const { data } = await api.get<Project[]>("/projects", { params });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`);

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await api.post<Project>("/projects", data);

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all projects queries
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.companyId] });
      // Invalidate client data (project count may have changed)
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", data.companyId] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProjectData;
    }) => {
      const response = await api.patch<Project>(`/projects/${id}`, data);

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all projects queries
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.companyId] });
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", data.companyId] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Invalidate time entries (project may have been associated)
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      // Invalidate all projects queries
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Invalidate client data (project count may have changed)
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Invalidate time entries (project may have been associated)
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
  });
};
