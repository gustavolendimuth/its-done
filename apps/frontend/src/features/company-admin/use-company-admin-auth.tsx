"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { companyAdminApi } from "@/lib/company-admin-axios";

export interface CompanyAdminProfile {
  id: string;
  email: string;
  companyId: string;
}

interface CompanyAdminAuthContextValue {
  admin: CompanyAdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    company: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const CompanyAdminAuthContext =
  createContext<CompanyAdminAuthContextValue | null>(null);

export function CompanyAdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, setAdmin] = useState<CompanyAdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // No token is accessible to JS (it lives in an httpOnly cookie) — the only
  // way to know if the session exists is to ask the backend, via the proxy.
  useEffect(() => {
    companyAdminApi
      .get<CompanyAdminProfile>("/company-admin/auth/profile")
      .then((res) => setAdmin(res.data))
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // The proxy writes the access_token into the httpOnly cookie and returns only `admin`.
    const res = await companyAdminApi.post<{
      admin: CompanyAdminProfile;
    }>("/company-admin/auth/login", { email, password });

    setAdmin(res.data.admin);
  }, []);

  const register = useCallback(
    async (company: string, email: string, password: string) => {
      // Same response shape as login: the proxy writes the access_token into
      // the httpOnly cookie and returns only `admin` — no extra login step.
      const res = await companyAdminApi.post<{
        admin: CompanyAdminProfile;
      }>("/company-admin/auth/register", { company, email, password });

      setAdmin(res.data.admin);
    },
    []
  );

  const logout = useCallback(async () => {
    await companyAdminApi.post("/company-admin/logout").catch(() => {});
    setAdmin(null);
  }, []);

  return (
    <CompanyAdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </CompanyAdminAuthContext.Provider>
  );
}

export function useCompanyAdminAuth() {
  const ctx = useContext(CompanyAdminAuthContext);
  if (!ctx) {
    throw new Error(
      "useCompanyAdminAuth must be used within an CompanyAdminAuthProvider"
    );
  }
  return ctx;
}
