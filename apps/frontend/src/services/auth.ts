import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginDto) => {
      const response = await api.post<AuthResponse>("/auth/login", data);
      return response.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterDto) => {
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: ForgotPasswordDto) => {
      const response = await api.post<{ message: string }>(
        "/auth/forgot-password",
        data
      );
      return response.data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: ResetPasswordDto) => {
      const response = await api.post<{ message: string }>(
        "/auth/reset-password",
        data
      );
      return response.data;
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<void>("/auth/logout");
      return response.data;
    },
  });
};

export const useMe = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get<User>("/auth/me");
      return response.data;
    },
  });
};
