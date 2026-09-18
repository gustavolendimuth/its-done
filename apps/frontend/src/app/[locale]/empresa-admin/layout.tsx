import { EmpresaAdminAuthProvider } from "@/features/empresa-admin";

/**
 * MW-24 — Área própria do Administrador da Empresa: não reaproveita o
 * MainLayout/menu do Colaborador (ticket explícito sobre isso). Este layout
 * cobre tanto /empresa-admin/login quanto /empresa-admin/dashboard, só pra
 * disponibilizar a sessão de EmpresaAdmin (contexto próprio, sem NextAuth)
 * pras duas rotas.
 */
export default function EmpresaAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmpresaAdminAuthProvider>{children}</EmpresaAdminAuthProvider>;
}
