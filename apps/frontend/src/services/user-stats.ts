import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  totalActiveUsers: number;
  totalInactiveUsers: number;
  totalUsersByRole: {
    role: string;
    count: number;
  }[];
  totalUsersByStatus: {
    status: string;
    count: number;
  }[];
  totalUsersByMonth: {
    month: string;
    count: number;
  }[];
}

export const useUserStats = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ["users", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<UserStats>("/users/stats", {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
