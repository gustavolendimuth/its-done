"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { empresaAdminApi } from "@/lib/empresa-admin-axios";

export interface EmpresaAdminProfile {
  id: string;
  email: string;
  empresaId: string;
}

interface EmpresaAdminAuthContextValue {
  admin: EmpresaAdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const EmpresaAdminAuthContext =
  createContext<EmpresaAdminAuthContextValue | null>(null);

export function EmpresaAdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, setAdmin] = useState<EmpresaAdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Não há token acessível ao JS (mora num cookie httpOnly) — a única forma
  // de saber se a sessão existe é perguntar ao backend, via proxy.
  useEffect(() => {
    empresaAdminApi
      .get<EmpresaAdminProfile>("/empresa-admin/auth/profile")
      .then((res) => setAdmin(res.data))
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // O proxy grava o access_token no cookie httpOnly e devolve só `admin`.
    const res = await empresaAdminApi.post<{
      admin: EmpresaAdminProfile;
    }>("/empresa-admin/auth/login", { email, password });

    setAdmin(res.data.admin);
  }, []);

  const logout = useCallback(async () => {
    await empresaAdminApi.post("/empresa-admin/logout").catch(() => {});
    setAdmin(null);
  }, []);

  return (
    <EmpresaAdminAuthContext.Provider
      value={{ admin, isLoading, isAuthenticated: !!admin, login, logout }}
    >
      {children}
    </EmpresaAdminAuthContext.Provider>
  );
}

export function useEmpresaAdminAuth() {
  const ctx = useContext(EmpresaAdminAuthContext);
  if (!ctx) {
    throw new Error(
      "useEmpresaAdminAuth must be used within an EmpresaAdminAuthProvider"
    );
  }
  return ctx;
}
