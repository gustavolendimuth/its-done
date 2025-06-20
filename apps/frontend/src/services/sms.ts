import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface SendSmsDto {
  to: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
}

export interface SendBulkSmsDto {
  to: string[];
  message: string;
  template?: string;
  data?: Record<string, any>;
}

export const useSendSms = () => {
  return useMutation({
    mutationFn: async (data: SendSmsDto) => {
      const response = await api.post<void>("/sms/send", data);
      return response.data;
    },
  });
};

export const useSendBulkSms = () => {
  return useMutation({
    mutationFn: async (data: SendBulkSmsDto) => {
      const response = await api.post<void>("/sms/send/bulk", data);
      return response.data;
    },
  });
};
