import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { empresaAdminApi } from "@/lib/empresa-admin-axios";

export interface EmpresaDashboardOverview {
  colaboradoresAtivos: number;
  horasPeriodo: number;
  totalFaturado: number;
  convitesPendentes: number;
  from: string;
  to: string;
}

export type ColaboradorOrigin = "CONVITE" | "DOMINIO" | null;

export interface ColaboradorDashboardRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  origin: ColaboradorOrigin;
  horas: number;
  projetos: number;
  faturado: number;
}

export type ConvitePendenteStatus = "PENDING" | "LINKED" | "REVOKED";

export interface ConvitePendente {
  id: string;
  empresaId: string;
  email: string;
  status: ConvitePendenteStatus;
  linkedAt: string | null;
  createdAt: string;
}

export type DominioAutorizadoStatus = "PENDING" | "CONFIRMED" | "REVOKED";

export interface DominioAutorizado {
  id: string;
  empresaId: string;
  domain: string;
  status: DominioAutorizadoStatus;
  confirmedAt: string | null;
  createdAt: string;
}

export interface DashboardPeriod {
  from?: string;
  to?: string;
}

export function useEmpresaDashboardOverview(period: DashboardPeriod) {
  return useQuery({
    queryKey: ["empresa-admin", "dashboard", "overview", period],
    queryFn: async () => {
      const res = await empresaAdminApi.get<EmpresaDashboardOverview>(
        "/empresa-admin/dashboard/overview",
        { params: period }
      );
      return res.data;
    },
  });
}

export function useEmpresaDashboardColaboradores(period: DashboardPeriod) {
  return useQuery({
    queryKey: ["empresa-admin", "dashboard", "colaboradores", period],
    queryFn: async () => {
      const res = await empresaAdminApi.get<ColaboradorDashboardRow[]>(
        "/empresa-admin/dashboard/colaboradores",
        { params: period }
      );
      return res.data;
    },
  });
}

export function useEmpresaInvites() {
  return useQuery({
    queryKey: ["empresa-admin", "invites"],
    queryFn: async () => {
      const res = await empresaAdminApi.get<ConvitePendente[]>(
        "/empresa-admin/invites"
      );
      return res.data;
    },
  });
}

export function useCreateEmpresaInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await empresaAdminApi.post("/empresa-admin/invites", {
        email,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-admin", "invites"] });
      queryClient.invalidateQueries({
        queryKey: ["empresa-admin", "dashboard"],
      });
    },
  });
}

export function useRevokeEmpresaInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await empresaAdminApi.delete(`/empresa-admin/invites/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-admin", "invites"] });
      queryClient.invalidateQueries({
        queryKey: ["empresa-admin", "dashboard"],
      });
    },
  });
}

export function useEmpresaDomains() {
  return useQuery({
    queryKey: ["empresa-admin", "domains"],
    queryFn: async () => {
      const res = await empresaAdminApi.get<DominioAutorizado[]>(
        "/empresa-admin/domains"
      );
      return res.data;
    },
  });
}

export function useCreateEmpresaDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (domain: string) => {
      const res = await empresaAdminApi.post("/empresa-admin/domains", {
        domain,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-admin", "domains"] });
    },
  });
}

export function useRevokeEmpresaDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await empresaAdminApi.delete(`/empresa-admin/domains/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-admin", "domains"] });
    },
  });
}

export function useRequestEmpresaDomainConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await empresaAdminApi.post(
        `/empresa-admin/domains/${id}/confirm`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-admin", "domains"] });
    },
  });
}

/**
 * Baixa o CSV do período agregado (MW-24 — botão de exportar, fora das
 * abas) e dispara o download no browser via Blob, sem depender de um link
 * público direto pro backend (que exigiria expor o Bearer token na URL).
 */
export async function downloadEmpresaDashboardExport(
  period: DashboardPeriod
): Promise<void> {
  const res = await empresaAdminApi.get("/empresa-admin/dashboard/export", {
    params: period,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = "empresa-dashboard.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
