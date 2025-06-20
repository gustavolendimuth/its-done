import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name?: string;
    email: string;
    company: string;
  };
  _count: {
    workHours: number;
  };
}

export interface CreateProjectData {
  name: string;
  description?: string;
  clientId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  clientId?: string;
}

// React Query hooks for projects
export const useProjects = (clientId?: string) => {
  return useQuery({
    queryKey: ["projects", clientId],
    queryFn: async () => {
      const params = clientId ? { clientId } : {};
      const { data } = await api.get<Project[]>("/projects", { params });
      return data;
    },
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.clientId] });
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.clientId] });
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
