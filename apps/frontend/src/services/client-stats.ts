import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ClientSpecificStats } from "@/types/client";

export interface ClientStats {
  totalClients: number;
  totalHours: number;
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalCanceled: number;
  totalOverdue: number;
  totalHoursByClient: {
    clientId: string;
    clientName: string;
    totalHours: number;
  }[];
  totalAmountByClient: {
    clientId: string;
    clientName: string;
    totalAmount: number;
  }[];
  totalHoursByMonth: {
    month: string;
    totalHours: number;
  }[];
  totalAmountByMonth: {
    month: string;
    totalAmount: number;
  }[];
}

export function useClientSpecificStats(clientId: string) {
  return useQuery<ClientSpecificStats>({
    queryKey: ["clients", clientId, "stats"],
    queryFn: async () => {
      const response = await api.get(`/clients/${clientId}/stats`);
      return response.data;
    },
  });
}

export function useClientStats() {
  return useQuery<ClientStats>({
    queryKey: ["clients", "stats"],
    queryFn: async () => {
      const response = await api.get("/clients/stats");
      return response.data;
    },
  });
}
