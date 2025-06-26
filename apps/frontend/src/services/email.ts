import { useMutation } from "@tanstack/react-query";

import api from "@/lib/axios";

// Tipo para dados de template de email - valores que podem ser interpolados
type EmailTemplateData = Record<string, string | number | boolean>;

export interface SendEmailDto {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: EmailTemplateData;
  attachments?: {
    filename: string;
    content: string;
    contentType: string;
  }[];
}

export interface SendBulkEmailDto {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: EmailTemplateData;
  attachments?: {
    filename: string;
    content: string;
    contentType: string;
  }[];
}

export const useSendEmail = () => {
  return useMutation({
    mutationFn: async (data: SendEmailDto) => {
      const response = await api.post<void>("/email/send", data);

      return response.data;
    },
  });
};

export const useSendBulkEmail = () => {
  return useMutation({
    mutationFn: async (data: SendBulkEmailDto) => {
      const response = await api.post<void>("/email/send/bulk", data);

      return response.data;
    },
  });
};
