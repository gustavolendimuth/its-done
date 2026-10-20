"use client";

import { ArrowLeft, Building2, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useResetPasswordCompanyAdmin } from "@/features/company-admin";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return "Não foi possível redefinir a senha. Tente novamente.";
}

function TokenErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-destructive" />
        <CardTitle>Não foi possível redefinir a senha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Link
            href="/company-admin/forgot-password"
            className="inline-flex items-center text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Pedir um novo link
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyAdminResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const resetPasswordMutation = useResetPasswordCompanyAdmin();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(
    token ? null : "Link de redefinição inválido ou incompleto."
  );
  const [success, setSuccess] = useState(false);

  if (tokenError) {
    return <TokenErrorCard message={tokenError} />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token: token as string,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setTokenError(getErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader className="text-center space-y-2">
        <Building2 className="mx-auto h-8 w-8 text-primary" />
        <CardTitle>Redefinir senha</CardTitle>
        <p className="text-sm text-muted-foreground">
          Administrador da Empresa
        </p>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Senha redefinida com sucesso. Redirecionando pro login…
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
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
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Redefinir senha
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function CompanyAdminResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Carregando…</div>}>
          <CompanyAdminResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
