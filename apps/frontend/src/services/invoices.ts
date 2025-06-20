import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Invoice {
  id: string;
  number?: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  invoiceWorkHours?: {
    id: string;
    workHour: {
      id: string;
      date: string;
      description: string;
      hours: number;
      client?: {
        id: string;
        name: string;
        email: string;
        company?: string;
      };
      project?: {
        id: string;
        name: string;
      };
    };
  }[];
  amount: number;
  dueDate?: string;
  status: "PENDING" | "PAID" | "CANCELED" | "pending" | "paid" | "canceled";
  fileUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  clientId: string;
  amount: number;
  workHourIds: string[];
  fileUrl?: string;
  description?: string;
  status?: string;
}

export interface UpdateInvoiceDto {
  number?: string;
  status?: string;
  fileUrl?: string;
  amount?: number;
  description?: string;
}

export const useInvoices = (params?: {
  from?: string;
  to?: string;
  clientId?: string;
  status?: Invoice["status"];
}) => {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>("/invoices", {
        params,
      });
      return data;
    },
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const { data } = await api.get<Invoice>(`/invoices/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceDto) => {
      const response = await api.post<Invoice>("/invoices", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInvoiceDto;
    }) => {
      const response = await api.patch<Invoice>(`/invoices/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Invoice>(`/invoices/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
};

export const useUploadInvoiceFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<Invoice>(
        `/invoices/${id}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
};

export const useClientInvoices = (clientId: string) => {
  return useQuery({
    queryKey: ["clients", clientId, "invoices"],
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>(
        `/clients/${clientId}/invoices`
      );
      return data;
    },
    enabled: !!clientId,
  });
};

// Legacy service object for compatibility
export const invoicesService = {
  async findByClient(clientId: string): Promise<Invoice[]> {
    const { data } = await api.get<Invoice[]>(
      `/public/client/${clientId}/invoices`
    );
    return data;
  },
};
