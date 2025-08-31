import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";

export interface WorkHoursStats {
  totalHours: number;
  totalEntries: number;
  averageHoursPerDay: number;
  averageHoursPerWeek: number;
  averageHoursPerMonth: number;
  activeClients: number;
  totalHoursByClient: {
    clientId: string;
    clientName: string;
    totalHours: number;
  }[];
  totalHoursByMonth: {
    month: string;
    totalHours: number;
  }[];
}

export const useWorkHoursStats = (params?: {
  from?: string;
  to?: string;
  clientId?: string;
}) => {
  console.log("📈 useWorkHoursStats called with params:", params);

  return useQuery({
    queryKey: ["workHours", "stats", params],
    queryFn: async () => {
      console.log("📈 useWorkHoursStats fetching data with params:", params);
      const { data } = await api.get<WorkHoursStats>("/work-hours/stats", {
        params,
      });
      console.log("📈 useWorkHoursStats received data:", data);
      return data;
    },
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data (renamed from cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
