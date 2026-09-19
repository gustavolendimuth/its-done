import { useQuery } from "@tanstack/react-query";

import { CompanySpecificStats } from "@/features/companies/types";
import api from "@/lib/axios";

export interface CompanyStats {
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

export function useCompanySpecificStats(companyId: string) {
  return useQuery<CompanySpecificStats>({
    queryKey: ["clients", companyId, "stats"],
    queryFn: async () => {
      const response = await api.get(`/companies/${companyId}/stats`);

      return response.data;
    },
  });
}

export function useCompanyStats() {
  return useQuery<CompanyStats>({
    queryKey: ["clients", "stats"],
    queryFn: async () => {
      const response = await api.get("/companies/stats");

      return response.data;
    },
  });
}
