import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface ImportOptions {
  type: "client" | "invoice" | "time" | "user";
  format: "excel" | "csv";
  file: File;
}

export const useImport = () => {
  return useMutation({
    mutationFn: async (options: ImportOptions) => {
      const formData = new FormData();

      formData.append("file", options.file);
      formData.append("type", options.type);
      formData.append("format", options.format);

      const response = await api.post("/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
  });
};
