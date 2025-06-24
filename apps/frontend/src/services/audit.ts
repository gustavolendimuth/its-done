import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface AuditLog {
  id: string;
  action: "create" | "update" | "delete";
  entity: string;
  entityId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  changes: Record<string, any>;
  createdAt: string;
}

export interface AuditStats {
  totalLogs: number;
  totalCreate: number;
  totalUpdate: number;
  totalDelete: number;
  totalLogsByAction: {
    action: string;
    count: number;
  }[];
  totalLogsByEntity: {
    entity: string;
    count: number;
  }[];
  totalLogsByUser: {
    userId: string;
    userName: string;
    count: number;
  }[];
  totalLogsByDay: {
    day: string;
    count: number;
  }[];
}

export const useAuditLogs = (params?: {
  from?: string;
  to?: string;
  action?: AuditLog["action"];
  entity?: string;
  userId?: string;
}) => {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: async () => {
      const { data } = await api.get<AuditLog[]>("/audit", {
        params,
      });

      return data;
    },
  });
};

export const useAuditLog = (id: string) => {
  return useQuery({
    queryKey: ["audit", id],
    queryFn: async () => {
      const { data } = await api.get<AuditLog>(`/audit/${id}`);

      return data;
    },
    enabled: !!id,
  });
};

export const useAuditStats = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ["audit", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<AuditStats>("/audit/stats", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
