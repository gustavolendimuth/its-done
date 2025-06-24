import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface DashboardStats {
  totalHours: number;
  totalClients: number;
  totalInvoices: number;
  pendingInvoices: number;
  thisMonthHours: number;
  lastMonthHours: number;
  hoursGrowth: number;
  recentActivities: {
    type: "work_hour" | "invoice" | "client";
    description: {
      key: string;
      values: Record<string, any>;
    };
    date: string;
    client?: string;
  }[];
  topClients: {
    id: string;
    name: string;
    totalHours: number;
    totalInvoices: number;
  }[];
  weeklyHours: {
    week: string;
    hours: number;
  }[];
}

export const useDashboardStats = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ["dashboard", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/stats", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
