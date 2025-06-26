import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";

// Tipos para metadata de logs do sistema
type LogMetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: LogMetadataValue }
  | LogMetadataValue[];

export interface SystemInfo {
  version: string;
  environment: string;
  database: {
    type: string;
    version: string;
    size: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  cpu: {
    cores: number;
    usage: number;
  };
  uptime: number;
  lastBackup?: string;
  lastUpdate?: string;
}

export interface SystemSettings {
  maintenance: boolean;
  debug: boolean;
  logLevel: "error" | "warn" | "info" | "debug";
  maxUploadSize: number;
  allowedFileTypes: string[];
  sessionTimeout: number;
  backupRetention: number;
  updateCheckInterval: number;
}

export const useSystemInfo = () => {
  return useQuery({
    queryKey: ["system", "info"],
    queryFn: async () => {
      const { data } = await api.get<SystemInfo>("/system/info");

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ["system", "settings"],
    queryFn: async () => {
      const { data } = await api.get<SystemSettings>("/system/settings");

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      const response = await api.patch<SystemSettings>(
        "/system/settings",
        data
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system", "settings"] });
    },
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: async () => {
      const { data } = await api.get<{
        status: "healthy" | "degraded" | "unhealthy";
        checks: {
          database: boolean;
          storage: boolean;
          memory: boolean;
          cpu: boolean;
        };
      }>("/system/health");

      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useSystemLogs = (params?: {
  from?: string;
  to?: string;
  level?: "error" | "warn" | "info" | "debug";
}) => {
  return useQuery({
    queryKey: ["system", "logs", params],
    queryFn: async () => {
      const { data } = await api.get<{
        logs: {
          timestamp: string;
          level: string;
          message: string;
          metadata: Record<string, LogMetadataValue>;
        }[];
      }>("/system/logs", {
        params,
      });

      return data;
    },
  });
};

export const useSystemMetrics = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ["system", "metrics", params],
    queryFn: async () => {
      const { data } = await api.get<{
        metrics: {
          timestamp: string;
          cpu: number;
          memory: number;
          storage: number;
          requests: number;
          errors: number;
        }[];
      }>("/system/metrics", {
        params,
      });

      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
