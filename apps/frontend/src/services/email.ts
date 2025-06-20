import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface SendEmailDto {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
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
  data?: Record<string, any>;
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
