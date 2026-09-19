import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { companyAdminApi } from "@/lib/company-admin-axios";

export interface CompanyDashboardOverview {
  collaboratorsAtivos: number;
  horasPeriodo: number;
  totalFaturado: number;
  pendingInvites: number;
  from: string;
  to: string;
}

export type CollaboradorOrigin = "INVITE" | "DOMAIN" | null;

export interface CollaboratorDashboardRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  origin: CollaboradorOrigin;
  horas: number;
  projetos: number;
  faturado: number;
}

export type PendingInviteStatus = "PENDING" | "LINKED" | "REVOKED";

export interface PendingInvite {
  id: string;
  companyId: string;
  email: string;
  status: PendingInviteStatus;
  linkedAt: string | null;
  createdAt: string;
}

export type AuthorizedDomainStatus = "PENDING" | "CONFIRMED" | "REVOKED";

export interface AuthorizedDomain {
  id: string;
  companyId: string;
  domain: string;
  status: AuthorizedDomainStatus;
  confirmedAt: string | null;
  createdAt: string;
}

export interface DashboardPeriod {
  from?: string;
  to?: string;
}

export function useCompanyDashboardOverview(period: DashboardPeriod) {
  return useQuery({
    queryKey: ["company-admin", "dashboard", "overview", period],
    queryFn: async () => {
      const res = await companyAdminApi.get<CompanyDashboardOverview>(
        "/company-admin/dashboard/overview",
        { params: period }
      );
      return res.data;
    },
  });
}

export function useCompanyDashboardCollaborators(period: DashboardPeriod) {
  return useQuery({
    queryKey: ["company-admin", "dashboard", "collaborators", period],
    queryFn: async () => {
      const res = await companyAdminApi.get<CollaboratorDashboardRow[]>(
        "/company-admin/dashboard/collaborators",
        { params: period }
      );
      return res.data;
    },
  });
}

export function useCompanyInvites() {
  return useQuery({
    queryKey: ["company-admin", "invites"],
    queryFn: async () => {
      const res = await companyAdminApi.get<PendingInvite[]>(
        "/company-admin/invites"
      );
      return res.data;
    },
  });
}

export function useCreateCompanyInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await companyAdminApi.post("/company-admin/invites", {
        email,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-admin", "invites"] });
      queryClient.invalidateQueries({
        queryKey: ["company-admin", "dashboard"],
      });
    },
  });
}

export function useRevokeCompanyInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await companyAdminApi.delete(`/company-admin/invites/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-admin", "invites"] });
      queryClient.invalidateQueries({
        queryKey: ["company-admin", "dashboard"],
      });
    },
  });
}

export function useCompanyDomains() {
  return useQuery({
    queryKey: ["company-admin", "domains"],
    queryFn: async () => {
      const res = await companyAdminApi.get<AuthorizedDomain[]>(
        "/company-admin/domains"
      );
      return res.data;
    },
  });
}

export function useCreateCompanyDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (domain: string) => {
      const res = await companyAdminApi.post("/company-admin/domains", {
        domain,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-admin", "domains"] });
    },
  });
}

export function useRevokeCompanyDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await companyAdminApi.delete(`/company-admin/domains/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-admin", "domains"] });
    },
  });
}

export function useRequestCompanyDomainConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await companyAdminApi.post(
        `/company-admin/domains/${id}/confirm`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-admin", "domains"] });
    },
  });
}

/**
 * Baixa o CSV do período agregado (MW-24 — botão de exportar, fora das
 * abas) e dispara o download no browser via Blob, sem depender de um link
 * público direto pro backend (que exigiria expor o Bearer token na URL).
 */
export async function downloadCompanyDashboardExport(
  period: DashboardPeriod
): Promise<void> {
  const res = await companyAdminApi.get("/company-admin/dashboard/export", {
    params: period,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = "company-dashboard.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * MW-26 — Desativação de Company. Nenhuma invalidação de cache no
 * onSuccess: o próprio CompanyAdmin que chamou isso deixa de existir (hard
 * delete), então o passo seguinte é sempre deslogar e sair do Dashboard, não
 * continuar nele com dados revalidados.
 */
export function useDeactivateCompany() {
  return useMutation({
    mutationFn: async () => {
      const res = await companyAdminApi.post("/company-admin/auth/deactivate");
      return res.data;
    },
  });
}
