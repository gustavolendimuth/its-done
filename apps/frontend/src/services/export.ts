import { useMutation } from "@tanstack/react-query";

import api from "@/lib/axios";

// Tipos específicos para filtros de exportação
type ExportFilters = {
  startDate?: string;
  endDate?: string;
  clientIds?: string[];
  userIds?: string[];
  status?: string[];
  includeArchived?: boolean;
};

export interface ExportOptions {
  type: "client" | "invoice" | "time" | "user";
  format: "pdf" | "excel" | "csv";
  filters?: ExportFilters;
}

export const useExport = () => {
  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await api.post("/export", options, {
        responseType: "blob",
      });

      return response.data;
    },
  });
};
