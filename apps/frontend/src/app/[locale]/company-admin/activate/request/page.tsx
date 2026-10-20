"use client";

import { Building2, CheckCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestCompanyActivation } from "@/features/company-admin";

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
  return "Não foi possível pedir a ativação. Tente novamente.";
}

function CompanyAdminActivationRequestContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  const requestActivation = useRequestCompanyActivation();

  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId) {
      return;
    }
    setError(null);
    try {
      await requestActivation.mutateAsync({
        companyId,
        email,
        domain: domain.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  let body: React.ReactNode;
  if (!companyId) {
    body = (
      <Alert variant="destructive">
        <AlertDescription>
          Link inválido: a Empresa não foi identificada.
        </AlertDescription>
      </Alert>
    );
  } else if (sent) {
    body = (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Se os dados conferirem, enviamos um link de confirmação para o email
          informado. O link expira em 1 hora.
        </AlertDescription>
      </Alert>
    );
  } else {
    body = (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Domínio da Empresa (opcional)</Label>
          <Input
            id="domain"
            type="text"
            placeholder="empresa.com"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Preencha se o seu email não for o contato cadastrado da Empresa. O
            email precisa pertencer a esse domínio.
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={requestActivation.isPending}
        >
          {requestActivation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Enviar link de ativação
        </Button>
      </form>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-primary" />
        <CardTitle>Ativar conta da Empresa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Peça o link de ativação para o Administrador
        </p>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

export default function CompanyAdminActivationRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Carregando…</div>}>
          <CompanyAdminActivationRequestContent />
        </Suspense>
      </div>
    </div>
  );
}
