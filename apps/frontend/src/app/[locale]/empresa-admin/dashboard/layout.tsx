"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useEmpresaAdminAuth } from "@/features/empresa-admin";

/**
 * MW-24 — Layout mínimo do Dashboard da Empresa: sem MainLayout/menu do
 * Colaborador (ticket explícito sobre isso), só um header com a sessão do
 * Administrador + logout, e o guard que manda pro login quando não há
 * sessão de EmpresaAdmin válida.
 */
export default function EmpresaAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { admin, isLoading, logout } = useEmpresaAdminAuth();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.replace("/empresa-admin/login");
    }
  }, [isLoading, admin, router]);

  const handleLogout = () => {
    logout();
    router.push("/empresa-admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Dashboard da Empresa</p>
            <p className="text-xs text-muted-foreground">{admin.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
