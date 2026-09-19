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
  companyId: string;
  createdAt: string;
  updatedAt: string;
  company?: {
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
  companyId: string;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {}

export const useAddresses = (companyId?: string) => {
  return useQuery({
    queryKey: ["addresses", companyId],
    queryFn: async () => {
      const params = companyId ? { companyId } : {};
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

export const useCompanyAddresses = (companyId: string) => {
  return useQuery({
    queryKey: ["clients", companyId, "addresses"],
    queryFn: async () => {
      console.log("Fetching addresses for client:", companyId);
      console.log("API base URL:", getApiUrl());

      try {
        const { data } = await api.get<Address[]>(
          `/addresses/company/${companyId}`
        );

        console.log("Addresses fetched successfully:", data);

        return data;
      } catch (error: unknown) {
        console.error("Error fetching client addresses:", error);
        throw error;
      }
    },
    enabled: !!companyId,
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
        queryKey: ["clients", variables.companyId, "addresses"],
      });
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({
        queryKey: ["clients", variables.companyId],
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
      if (data.companyId) {
        queryClient.invalidateQueries({
          queryKey: ["clients", data.companyId, "addresses"],
        });
        queryClient.invalidateQueries({ queryKey: ["clients", data.companyId] });
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
        queryKey: ["clients", data.companyId, "addresses"],
      });
      // Invalidate client data
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", data.companyId] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
