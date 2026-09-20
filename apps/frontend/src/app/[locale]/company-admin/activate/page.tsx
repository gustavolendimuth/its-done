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
import { useConfirmCompanyActivation } from "@/features/company-admin";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Não foi possível ativar a conta. Tente novamente.";
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-destructive" />
        <CardTitle>Não foi possível ativar a conta</CardTitle>
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

function CompanyAdminActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const confirmActivation = useConfirmCompanyActivation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [blockingError, setBlockingError] = useState<string | null>(
    token ? null : "Link de ativação inválido ou incompleto."
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
      const result = await confirmActivation.mutateAsync({
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
        "Conta ativada, mas não foi possível entrar automaticamente. Entre pelo login."
      );
      return;
    }

    router.push("/company-admin/dashboard");
  };

  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-primary" />
        <CardTitle>Ativar conta da Empresa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina a senha do primeiro Administrador
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
            disabled={confirmActivation.isPending}
          >
            {confirmActivation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Ativar conta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CompanyAdminActivatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Carregando…</div>}>
          <CompanyAdminActivateContent />
        </Suspense>
      </div>
    </div>
  );
}
