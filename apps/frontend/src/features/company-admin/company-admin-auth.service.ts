import { useMutation } from "@tanstack/react-query";

import { default as companyAdminApi } from "@/lib/axios";

export interface ForgotPasswordCompanyAdminDto {
  email: string;
}

export interface ResetPasswordCompanyAdminDto {
  token: string;
  newPassword: string;
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
