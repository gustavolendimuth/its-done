import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordDto {
  email: string;
}

export interface ResetPasswordConfirmDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordDto) => {
      const response = await api.post<void>("/password/change", data);
      return response.data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordDto) => {
      const response = await api.post<void>("/password/reset", data);
      return response.data;
    },
  });
};

export const useResetPasswordConfirm = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordConfirmDto) => {
      const response = await api.post<void>("/password/reset/confirm", data);
      return response.data;
    },
  });
};
