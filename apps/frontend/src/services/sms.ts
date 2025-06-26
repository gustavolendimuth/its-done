import { useMutation } from "@tanstack/react-query";

import api from "@/lib/axios";

// Tipo para dados de template SMS - valores que podem ser interpolados
type SmsTemplateData = Record<string, string | number | boolean>;

export interface SendSmsDto {
  to: string;
  message: string;
  template?: string;
  data?: SmsTemplateData;
}

export interface SendBulkSmsDto {
  to: string[];
  message: string;
  template?: string;
  data?: SmsTemplateData;
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
