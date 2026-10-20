"use client";

import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmCompanyDomain } from "@/features/company-admin";

const MISSING_TOKEN_MESSAGE = "Link de confirmação inválido ou incompleto.";

type Result =
  | { status: "pending" }
  | { status: "confirmed"; domain: string }
  | { status: "failed"; message: string };

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response;
    // Nest's ValidationPipe answers 400 with a list of messages.
    const message = response?.data?.message;
    if (Array.isArray(message) && message.length > 0) {
      return message.join("; ");
    }
    if (typeof message === "string" && message) {
      return message;
    }
  }
  return "Não foi possível confirmar o domínio. Tente novamente.";
}

function DashboardLink() {
  return (
    <div className="text-center">
      <Link
        href="/company-admin/dashboard"
        className="inline-flex items-center text-primary hover:underline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Ir para o painel
      </Link>
    </div>
  );
}

function CompanyAdminDomainConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const confirmDomain = useConfirmCompanyDomain();
  const [result, setResult] = useState<Result>(
    token
      ? { status: "pending" }
      : { status: "failed", message: MISSING_TOKEN_MESSAGE }
  );
  // The token is single-use: a second request (React StrictMode runs effects
  // twice in dev) would fail with "not pending" and hide the success.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) {
      return;
    }
    requested.current = true;
    confirmDomain
      .mutateAsync({ token })
      .then((domain) =>
        setResult({ status: "confirmed", domain: domain.domain })
      )
      .catch((error) =>
        setResult({ status: "failed", message: getErrorMessage(error) })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one request per token
  }, [token]);

  if (result.status === "pending") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Confirmando domínio…</p>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "confirmed") {
    return (
      <Card>
        <CardHeader className="text-center space-y-2">
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
          <CardTitle>Domínio confirmado</CardTitle>
          <p className="text-sm text-muted-foreground">
            O domínio {result.domain} agora está confirmado.
          </p>
        </CardHeader>
        <CardContent>
          <DashboardLink />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <XCircle className="mx-auto h-8 w-8 text-destructive" />
        <CardTitle>Não foi possível confirmar o domínio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
        <DashboardLink />
      </CardContent>
    </Card>
  );
}

export default function CompanyAdminDomainConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Carregando…</div>}>
          <CompanyAdminDomainConfirmContent />
        </Suspense>
      </div>
    </div>
  );
}
