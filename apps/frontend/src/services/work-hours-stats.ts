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
  return useQuery({
    queryKey: ["workHours", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<WorkHoursStats>("/work-hours/stats", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
