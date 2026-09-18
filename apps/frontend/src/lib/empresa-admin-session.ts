/**
 * MW-24 — Sessão de EmpresaAdmin é uma identidade separada de User: não
 * passa pelo NextAuth. O JWT do Administrador fica num cookie httpOnly
 * (nunca exposto a JS no browser), seguindo o mesmo padrão de segurança
 * documentado pro resto da aplicação (CLAUDE.md: "JWT tokens stored in
 * HTTP-only cookies"). Todo acesso ao backend passa pelo proxy em
 * `app/api/empresa-admin/[...path]/route.ts`, que lê este cookie
 * server-side e injeta o Bearer token na chamada real pro NestJS.
 */
export const EMPRESA_ADMIN_COOKIE_NAME = "empresa_admin_token";

// Espelha o `expiresIn: '30d'` do JwtModule do backend (empresa-admin.module.ts).
export const EMPRESA_ADMIN_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function empresaAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: EMPRESA_ADMIN_COOKIE_MAX_AGE_SECONDS,
  };
}
