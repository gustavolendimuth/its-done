import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { getApiUrl } from "@/lib/utils";

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
  client?: {
    id: string;
    company: string;
    name?: string;
  };
}

export interface CreateAddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  type?: string;
  isPrimary?: boolean;
  clientId: string;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {}

export const useAddresses = (clientId?: string) => {
  return useQuery({
    queryKey: ["addresses", clientId],
    queryFn: async () => {
      const params = clientId ? { clientId } : {};
      const { data } = await api.get<Address[]>("/addresses", { params });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useAddress = (id: string) => {
  return useQuery({
    queryKey: ["addresses", id],
    queryFn: async () => {
      const { data } = await api.get<Address>(`/addresses/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useClientAddresses = (clientId: string) => {
  return useQuery({
    queryKey: ["clients", clientId, "addresses"],
    queryFn: async () => {
      console.log("Fetching addresses for client:", clientId);
      console.log("API base URL:", getApiUrl());

      try {
        const { data } = await api.get<Address[]>(
          `/addresses/client/${clientId}`
        );
        console.log("Addresses fetched successfully:", data);
        return data;
      } catch (error: any) {
        console.error("Error fetching client addresses:", error);
        console.error("Error status:", error.response?.status);
        console.error("Error data:", error.response?.data);
        console.error("Request URL:", error.config?.url);
        console.error("Request headers:", error.config?.headers);
        throw error;
      }
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAddressDto) => {
      const response = await api.post<Address>("/addresses", data);
      return response.data;
    },
    onSuccess: (address, variables) => {
      // Invalidate all addresses queries
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({
        queryKey: ["clients", variables.clientId, "addresses"],
      });
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({
        queryKey: ["clients", variables.clientId],
      });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAddressDto;
    }) => {
      const response = await api.patch<Address>(`/addresses/${id}`, data);
      return response.data;
    },
    onSuccess: (address, { id, data }) => {
      // Invalidate all addresses queries
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["addresses", id] });
      if (data.clientId) {
        queryClient.invalidateQueries({
          queryKey: ["clients", data.clientId, "addresses"],
        });
        queryClient.invalidateQueries({ queryKey: ["clients", data.clientId] });
      }
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ message: string }>(
        `/addresses/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all addresses queries
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useSetPrimaryAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<Address>(`/addresses/${id}/set-primary`);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all addresses queries
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({
        queryKey: ["clients", data.clientId, "addresses"],
      });
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", data.clientId] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
