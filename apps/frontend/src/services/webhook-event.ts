import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";

// Tipo para payloads de webhook - pode conter dados estruturados variados
type WebhookPayload = Record<string, unknown>;

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: WebhookPayload;
  status: "pending" | "processing" | "completed" | "failed";
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const useWebhookEvents = (params?: {
  webhookId?: string;
  event?: string;
  status?: WebhookEvent["status"];
  from?: string;
  to?: string;
}) => {
  return useQuery({
    queryKey: ["webhook-events", params],
    queryFn: async () => {
      const { data } = await api.get<WebhookEvent[]>("/webhook-events", {
        params,
      });

      return data;
    },
  });
};

export const useWebhookEvent = (id: string) => {
  return useQuery({
    queryKey: ["webhook-events", id],
    queryFn: async () => {
      const { data } = await api.get<WebhookEvent>(`/webhook-events/${id}`);

      return data;
    },
    enabled: !!id,
  });
};

export const useWebhookEventStats = (params?: {
  from?: string;
  to?: string;
}) => {
  return useQuery({
    queryKey: ["webhook-events", "stats", params],
    queryFn: async () => {
      const { data } = await api.get<{
        totalEvents: number;
        totalPending: number;
        totalProcessing: number;
        totalCompleted: number;
        totalFailed: number;
        totalEventsByWebhook: {
          webhookId: string;
          webhookName: string;
          count: number;
        }[];
        totalEventsByEvent: {
          event: string;
          count: number;
        }[];
        totalEventsByStatus: {
          status: string;
          count: number;
        }[];
        totalEventsByDay: {
          day: string;
          count: number;
        }[];
      }>("/webhook-events/stats", {
        params,
      });

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
