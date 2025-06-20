import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export interface UpdateWebhookDto extends Partial<CreateWebhookDto> {}

export const useWebhooks = () => {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data } = await api.get<Webhook[]>("/webhooks");
      return data;
    },
  });
};

export const useWebhook = (id: string) => {
  return useQuery({
    queryKey: ["webhooks", id],
    queryFn: async () => {
      const { data } = await api.get<Webhook>(`/webhooks/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWebhookDto) => {
      const response = await api.post<Webhook>("/webhooks", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
};

export const useUpdateWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWebhookDto;
    }) => {
      const response = await api.patch<Webhook>(`/webhooks/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks", id] });
    },
  });
};

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<Webhook>(`/webhooks/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks", id] });
    },
  });
};

export const useTestWebhook = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<void>(`/webhooks/${id}/test`);
      return response.data;
    },
  });
};
