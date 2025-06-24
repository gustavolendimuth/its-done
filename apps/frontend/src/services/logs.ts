import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Log {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface LogStats {
  totalLogs: number;
  totalInfo: number;
  totalWarn: number;
  totalError: number;
  totalLogsByLevel: {
    level: string;
    count: number;
  }[];
  totalLogsByDay: {
    day: string;
    count: number;
  }[];
}

export const useLogs = (params?: {
  from?: string;
  to?: string;
  level?: Log["level"];
}) => {
  return useQuery({
    queryKey: ["logs", params],
    queryFn: async () => {
      const { data } = await api.get<Log[]>("/logs", {
        params,
      });

      return data;
    },
  });
};

export const useLog = (id: string) => {
  return useQuery({
    queryKey: ["logs", id],
    queryFn: async () => {
      const { data } = await api.get<Log>(`/logs/${id}`);

      return data;
    },
    enabled: !!id,
  });
};

export const useLogStats = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ["logs", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<LogStats>("/logs/stats", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
