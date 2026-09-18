import { useMutation } from "@tanstack/react-query";

import { empresaAdminApi } from "@/lib/empresa-admin-axios";

export interface ForgotPasswordEmpresaAdminDto {
  email: string;
}

export interface ResetPasswordEmpresaAdminDto {
  token: string;
  newPassword: string;
}

export function useForgotPasswordEmpresaAdmin() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordEmpresaAdminDto) => {
      const res = await empresaAdminApi.post<{ message: string }>(
        "/empresa-admin/auth/forgot-password",
        data
      );
      return res.data;
    },
  });
}

export function useResetPasswordEmpresaAdmin() {
  return useMutation({
    mutationFn: async (data: ResetPasswordEmpresaAdminDto) => {
      const res = await empresaAdminApi.post<{ message: string }>(
        "/empresa-admin/auth/reset-password",
        data
      );
      return res.data;
    },
  });
}
