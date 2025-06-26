import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";

export interface Backup {
  id: string;
  name: string;
  description: string;
  size: number;
  status: "pending" | "processing" | "completed" | "failed";
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBackupDto {
  name: string;
  description: string;
}

export interface UpdateBackupDto extends Partial<CreateBackupDto> {
  status?: Backup["status"];
  fileUrl?: string;
}

export const useBackups = () => {
  return useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const { data } = await api.get<Backup[]>("/backups");

      return data;
    },
  });
};

export const useBackup = (id: string) => {
  return useQuery({
    queryKey: ["backups", id],
    queryFn: async () => {
      const { data } = await api.get<Backup>(`/backups/${id}`);

      return data;
    },
    enabled: !!id,
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBackupDto) => {
      const response = await api.post<Backup>("/backups", data);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });
};

export const useUpdateBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBackupDto }) => {
      const response = await api.patch<Backup>(`/backups/${id}`, data);

      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      queryClient.invalidateQueries({ queryKey: ["backups", id] });
    },
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Backup>(`/backups/${id}`);

      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      queryClient.invalidateQueries({ queryKey: ["backups", id] });
    },
  });
};

export const useDownloadBackup = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get(`/backups/${id}/download`, {
        responseType: "blob",
      });

      return response.data;
    },
  });
};

export const useRestoreBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Backup>(`/backups/${id}/restore`);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });
};
