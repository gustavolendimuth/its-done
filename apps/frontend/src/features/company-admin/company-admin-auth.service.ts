import { useMutation, useQuery } from "@tanstack/react-query";

import { default as companyAdminApi } from "@/lib/axios";

export interface ForgotPasswordCompanyAdminDto {
  email: string;
}

export interface ResetPasswordCompanyAdminDto {
  token: string;
  newPassword: string;
}

export interface ConfirmCompanyActivationDto {
  token: string;
  password: string;
}

export interface ConfirmCompanyAdminInviteDto {
  token: string;
  password: string;
}

export interface CompanyAdminAuthResponse {
  admin: { id: string; email: string; companyId: string };
}

export interface RequestCompanyActivationDto {
  companyId: string;
  email: string;
  domain?: string;
}

export function useForgotPasswordCompanyAdmin() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordCompanyAdminDto) => {
      const res = await companyAdminApi.post<{ message: string }>(
        "/company-admin/auth/forgot-password",
        data
      );
      return res.data;
    },
  });
}

export function useResetPasswordCompanyAdmin() {
  return useMutation({
    mutationFn: async (data: ResetPasswordCompanyAdminDto) => {
      const res = await companyAdminApi.post<{ message: string }>(
        "/company-admin/auth/reset-password",
        data
      );
      return res.data;
    },
  });
}

export function useConfirmCompanyActivation() {
  return useMutation({
    mutationFn: async (data: ConfirmCompanyActivationDto) => {
      const res = await companyAdminApi.post<CompanyAdminAuthResponse>(
        "/company-admin/auth/activate/confirm",
        data
      );
      return res.data;
    },
  });
}

export function useConfirmCompanyAdminInvite() {
  return useMutation({
    mutationFn: async (data: ConfirmCompanyAdminInviteDto) => {
      const res = await companyAdminApi.post<CompanyAdminAuthResponse>(
        "/company-admin/auth/invite/confirm",
        data
      );
      return res.data;
    },
  });
}

export function useRequestCompanyActivation() {
  return useMutation({
    mutationFn: async ({ companyId, ...body }: RequestCompanyActivationDto) => {
      const res = await companyAdminApi.post<{ message: string }>(
        `/company-admin/auth/activate/${encodeURIComponent(companyId)}/request`,
        body
      );
      return res.data;
    },
  });
}

export function usePublicActivationStatus(companyId: string | undefined) {
  return useQuery({
    queryKey: ["publicActivationStatus", companyId],
    queryFn: async () => {
      const res = await companyAdminApi.get<{ hasActiveAdmin: boolean }>(
        `/public/company/${encodeURIComponent(companyId as string)}/activation-status`
      );
      return res.data;
    },
    enabled: !!companyId,
    retry: false,
  });
}
