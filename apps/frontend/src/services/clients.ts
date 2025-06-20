import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Client {
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
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name?: string;
  email: string;
  phone?: string;
  company: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await api.get<Client[]>("/clients");
      return data;
    },
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientDto) => {
      console.log("Making API request to create client with data:", data);
      try {
        const response = await api.post<Client>("/clients", data);
        console.log("API response:", response.data);
        return response.data;
      } catch (error) {
        console.error("API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientDto }) => {
      const response = await api.patch<Client>(`/clients/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Client>(`/clients/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
};

export const useClientStats = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: ["clients", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<{
        totalClients: number;
        totalHours: number;
        totalInvoices: number;
      }>("/clients/stats", {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
