"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useCompanyAdminAuth } from "@/features/company-admin";

/**
 * MW-24 — Minimal Company Dashboard layout: no Collaborator MainLayout/menu
 * (explicit ticket requirement), just a header with the admin session +
 * logout, and the guard that redirects to login when there is no valid
 * CompanyAdmin session.
 */
export default function CompanyAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { admin, isLoading, logout } = useCompanyAdminAuth();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.replace("/company-admin/login");
    }
  }, [isLoading, admin, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/company-admin/login");
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
            <p className="text-sm font-semibold">Dashboard da Company</p>
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
