"use client";

import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { useConfirmCompanyAdminInvite } from "@/features/company-admin";

const MISSING_TOKEN_MESSAGE = "Link de convite inválido ou incompleto.";
const EXPIRED_TOKEN_MESSAGE =
  "Este convite expirou. Peça um novo convite a quem convidou você.";

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
  return "Não foi possível aceitar o convite. Tente novamente.";
}

// Reads the `exp` claim without verifying the signature: only used to skip a
// request that the backend would reject anyway. The backend stays the authority.
function getTokenProblem(token: string | null): string | null {
  if (!token) {
    return MISSING_TOKEN_MESSAGE;
  }
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof exp === "number" && exp * 1000 <= Date.now()) {
      return EXPIRED_TOKEN_MESSAGE;
    }
  } catch {
    return MISSING_TOKEN_MESSAGE;
  }
  return null;
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-destructive" />
        <CardTitle>Não foi possível aceitar o convite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir para o login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyAdminInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const confirmInvite = useConfirmCompanyAdminInvite();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [blockingError, setBlockingError] = useState<string | null>(
    getTokenProblem(token)
  );

  if (blockingError) {
    return <ErrorCard message={blockingError} />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    let email: string;
    try {
      const result = await confirmInvite.mutateAsync({
        token: token as string,
        password,
      });
      email = result.admin.email;
    } catch (err) {
      setBlockingError(getErrorMessage(err));
      return;
    }

    const session = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!session?.ok) {
      setBlockingError(
        "Convite aceito, mas não foi possível entrar automaticamente. Entre pelo login."
      );
      return;
    }

    router.push("/company-admin/dashboard");
  };

  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-primary" />
        <CardTitle>Aceitar convite de Administrador</CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina a sua senha para administrar a Empresa
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={confirmInvite.isPending}
          >
            {confirmInvite.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Aceitar convite
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CompanyAdminInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Carregando…</div>}>
          <CompanyAdminInviteContent />
        </Suspense>
      </div>
    </div>
  );
}
