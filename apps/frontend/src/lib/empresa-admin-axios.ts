import axios from "axios";

/**
 * MW-24 — Sessão de EmpresaAdmin é uma identidade separada de User: não
 * passa pelo NextAuth. Todas as chamadas vão pro proxy same-origin em
 * `/api/empresa-admin/*` (ver `app/api/empresa-admin/[...path]/route.ts`),
 * que injeta o Bearer token a partir de um cookie httpOnly — o browser
 * nunca lê nem guarda o JWT em si (cookie same-origin vai junto
 * automaticamente, sem precisar de `withCredentials`).
 */
export const empresaAdminApi = axios.create({
  baseURL: "/api",
});

empresaAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (!window.location.pathname.includes("/empresa-admin/login")) {
        window.location.href = "/empresa-admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default empresaAdminApi;
