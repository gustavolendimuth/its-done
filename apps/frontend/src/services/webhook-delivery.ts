import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: "pending" | "processing" | "completed" | "failed";
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
  retryCount: number;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const useWebhookDeliveries = (params?: {
  webhookId?: string;
  eventId?: string;
  status?: WebhookDelivery["status"];
  from?: string;
  to?: string;
}) => {
  return useQuery({
    queryKey: ["webhook-deliveries", params],
    queryFn: async () => {
      const { data } = await api.get<WebhookDelivery[]>("/webhook-deliveries", {
        params,
      });
      return data;
    },
  });
};

export const useWebhookDelivery = (id: string) => {
  return useQuery({
    queryKey: ["webhook-deliveries", id],
    queryFn: async () => {
      const { data } = await api.get<WebhookDelivery>(
        `/webhook-deliveries/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
};

export const useWebhookDeliveryStats = (params?: {
  from?: string;
  to?: string;
}) => {
  return useQuery({
    queryKey: ["webhook-deliveries", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<{
        totalDeliveries: number;
        totalPending: number;
        totalProcessing: number;
        totalCompleted: number;
        totalFailed: number;
        totalDeliveriesByWebhook: {
          webhookId: string;
          webhookName: string;
          count: number;
        }[];
        totalDeliveriesByEvent: {
          eventId: string;
          eventName: string;
          count: number;
        }[];
        totalDeliveriesByStatus: {
          status: string;
          count: number;
        }[];
        totalDeliveriesByDay: {
          day: string;
          count: number;
        }[];
      }>("/webhook-deliveries/stats", {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
