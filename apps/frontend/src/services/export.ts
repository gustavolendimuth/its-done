import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface ExportOptions {
  type: "client" | "invoice" | "time" | "user";
  format: "pdf" | "excel" | "csv";
  filters?: Record<string, any>;
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
