"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  clearEmpresaAdminToken,
  empresaAdminApi,
  getEmpresaAdminToken,
  setEmpresaAdminToken,
} from "@/lib/empresa-admin-axios";

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
  logout: () => void;
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

  useEffect(() => {
    const token = getEmpresaAdminToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    empresaAdminApi
      .get<EmpresaAdminProfile>("/empresa-admin/auth/profile")
      .then((res) => setAdmin(res.data))
      .catch(() => {
        clearEmpresaAdminToken();
        setAdmin(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await empresaAdminApi.post<{
      access_token: string;
      admin: EmpresaAdminProfile;
    }>("/empresa-admin/auth/login", { email, password });

    setEmpresaAdminToken(res.data.access_token);
    setAdmin(res.data.admin);
  }, []);

  const logout = useCallback(() => {
    clearEmpresaAdminToken();
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
