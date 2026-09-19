import { useQuery } from "@tanstack/react-query";

import { ClientSpecificStats } from "@/features/clients/types";
import api from "@/lib/axios";

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
    companyId: string;
    clientName: string;
    totalHours: number;
  }[];
  totalAmountByClient: {
    companyId: string;
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

export function useClientSpecificStats(companyId: string) {
  return useQuery<ClientSpecificStats>({
    queryKey: ["clients", companyId, "stats"],
    queryFn: async () => {
      const response = await api.get(`/clients/${companyId}/stats`);

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
