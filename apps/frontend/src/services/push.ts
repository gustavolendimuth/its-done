import { useMutation } from "@tanstack/react-query";

import api from "@/lib/axios";

// Tipo para dados personalizados de push notification
type PushNotificationData = Record<string, string | number | boolean>;

export interface SendPushDto {
  to: string;
  title: string;
  body: string;
  data?: PushNotificationData;
  icon?: string;
  badge?: string;
  sound?: string;
  clickAction?: string;
}

export interface SendBulkPushDto {
  to: string[];
  title: string;
  body: string;
  data?: PushNotificationData;
  icon?: string;
  badge?: string;
  sound?: string;
  clickAction?: string;
}

export const useSendPush = () => {
  return useMutation({
    mutationFn: async (data: SendPushDto) => {
      const response = await api.post<void>("/push/send", data);

      return response.data;
    },
  });
};

export const useSendBulkPush = () => {
  return useMutation({
    mutationFn: async (data: SendBulkPushDto) => {
      const response = await api.post<void>("/push/send/bulk", data);

      return response.data;
    },
  });
};
