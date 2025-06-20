import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Report {
  id: string;
  name: string;
  description: string;
  type: "client" | "invoice" | "time" | "user";
  format: "pdf" | "excel" | "csv";
  filters: Record<string, any>;
  status: "pending" | "processing" | "completed" | "failed";
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportDto {
  name: string;
  description: string;
  type: Report["type"];
  format: Report["format"];
  filters: Record<string, any>;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

export interface HoursReport {
  totalHours: number;
  totalDays: number;
  averageHoursPerDay: number;
  clientBreakdown: {
    clientId: string;
    clientName: string;
    totalHours: number;
    percentage: number;
  }[];
  weeklyBreakdown: {
    week: string;
    totalHours: number;
  }[];
  monthlyBreakdown: {
    month: string;
    totalHours: number;
  }[];
}

export interface InvoiceReport {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  clientBreakdown: {
    clientId: string;
    clientName: string;
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
  }[];
}

export interface SummaryReport {
  hours: HoursReport;
  invoices: InvoiceReport;
  period: {
    startDate?: string;
    endDate?: string;
  };
}

// Analytics Hooks
export const useHoursReport = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ["reports", "hours", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.clientId) params.append("clientId", filters.clientId);
      
      const { data } = await api.get<HoursReport>(`/reports/hours?${params}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useInvoiceReport = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ["reports", "invoices", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.clientId) params.append("clientId", filters.clientId);
      
      const { data } = await api.get<InvoiceReport>(`/reports/invoices?${params}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useSummaryReport = (filters?: Omit<ReportFilters, 'clientId'>) => {
  return useQuery({
    queryKey: ["reports", "summary", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      
      const { data } = await api.get<SummaryReport>(`/reports/summary?${params}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export interface UpdateReportDto extends Partial<CreateReportDto> {
  status?: Report["status"];
  fileUrl?: string;
}

export const useReports = () => {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await api.get<Report[]>("/reports");
      return data;
    },
  });
};

export const useReport = (id: string) => {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: async () => {
      const { data } = await api.get<Report>(`/reports/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReportDto) => {
      const response = await api.post<Report>("/reports", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReportDto }) => {
      const response = await api.patch<Report>(`/reports/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports", id] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Report>(`/reports/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports", id] });
    },
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get(`/reports/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    },
  });
};
