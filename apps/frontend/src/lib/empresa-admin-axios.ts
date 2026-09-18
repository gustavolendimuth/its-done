import axios from "axios";

import { getApiUrl } from "@/lib/utils";

/**
 * MW-24 — Sessão de EmpresaAdmin é uma identidade separada de User: não
 * passa pelo NextAuth (que só sabe de sessão de User, guardada como
 * `session.accessToken`). Guardamos o JWT do Administrador em localStorage
 * sob esta chave, e este client injeta o Bearer token a partir daí — em vez
 * de reaproveitar `@/lib/axios`, que lê o token de `getSession()`.
 */
export const EMPRESA_ADMIN_TOKEN_KEY = "empresaAdminToken";

export function getEmpresaAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMPRESA_ADMIN_TOKEN_KEY);
}

export function setEmpresaAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMPRESA_ADMIN_TOKEN_KEY, token);
}

export function clearEmpresaAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EMPRESA_ADMIN_TOKEN_KEY);
}

export const empresaAdminApi = axios.create({
  baseURL: getApiUrl(),
});

empresaAdminApi.interceptors.request.use((config) => {
  const token = getEmpresaAdminToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

empresaAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearEmpresaAdminToken();
      if (!window.location.pathname.includes("/empresa-admin/login")) {
        window.location.href = "/empresa-admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default empresaAdminApi;
