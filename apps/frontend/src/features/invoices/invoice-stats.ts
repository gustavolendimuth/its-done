import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalAmountByClient: {
    clientId: string;
    clientName: string;
    totalAmount: number;
  }[];
  totalAmountByMonth: {
    month: string;
    totalAmount: number;
  }[];
}

export const useInvoiceStats = (params?: {
  from?: string;
  to?: string;
  clientId?: string;
}) => {
  return useQuery({
    queryKey: ["invoices", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<InvoiceStats>("/invoices/stats", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
