import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface SystemStats {
  users: {
    total: number;
    admins: number;
    regular: number;
  };
  clients: number;
  projects: number;
  workHours: {
    total: number;
    totalHours: number;
  };
  invoices: {
    total: number;
    pending: number;
    paid: number;
  };
  revenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  _count?: {
    clients: number;
    projects: number;
    workHours: number;
  };
}

export interface RecentActivity {
  workHours: any[];
  invoices: any[];
  newUsers: any[];
}

export const useSystemStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await api.get<SystemStats>("/admin/stats");
      return response.data;
    },
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await api.get<AdminUser[]>("/admin/users");
      return response.data;
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "USER" | "ADMIN";
    }) => {
      const response = await api.post<AdminUser>(
        `/admin/users/${userId}/role`,
        { role }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ["admin", "activity"],
    queryFn: async () => {
      const response = await api.get<RecentActivity>("/admin/activity");
      return response.data;
    },
  });
};
