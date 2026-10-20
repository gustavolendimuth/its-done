import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/axios";

export interface Company {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  company: string;
  addresses?: Address[];
  website?: string;
  logo?: string;
  hourlyRate?: number;
  currency?: string;
  language?: string;
  timezone?: string;
  /** True when the Company has at least one active CompanyAdmin (MW-25). */
  hasActiveAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: string;
  isPrimary: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name?: string;
  email: string;
  phone?: string;
  company: string;
  /** Fallback hourly rate used to bill WorkHours that have no Project. */
  hourlyRate?: number;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

export const useCompanies = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await api.get<Company[]>("/companies");

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const { data } = await api.get<Company>(`/companies/${id}`);

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompanyDto) => {
      console.log("Making API request to create company with data:", data);
      try {
        const response = await api.post<Company>("/companies", data);

        console.log("API response:", response.data);

        return response.data;
      } catch (error) {
        console.error("API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all clients queries
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      // Invalidate company stats
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Invalidate work hours stats
      queryClient.invalidateQueries({ queryKey: ["workHours", "stats"] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCompanyDto;
    }) => {
      const response = await api.patch<Company>(`/companies/${id}`, data);

      return response.data;
    },
    onSuccess: (_, { id }) => {
      // Invalidate all clients queries
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
      // Invalidate company stats
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Invalidate work hours stats
      queryClient.invalidateQueries({ queryKey: ["workHours", "stats"] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Company>(`/companies/${id}`);

      return response.data;
    },
    onSuccess: (_, id) => {
      // Invalidate all clients queries
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
      // Invalidate company stats
      queryClient.invalidateQueries({ queryKey: ["clients", "stats"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Invalidate work hours stats
      queryClient.invalidateQueries({ queryKey: ["workHours", "stats"] });
      // Invalidate time entries (company may have been associated)
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
  });
};

export const useCompanyStats = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ["clients", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<{
        totalClients: number;
        totalHours: number;
        totalInvoices: number;
      }>("/companies/stats", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
