"use client";

import { ArrowLeft, Building2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
import { useForgotPasswordCompanyAdmin } from "@/features/company-admin";

export default function CompanyAdminForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPasswordCompanyAdmin();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const res = await forgotPasswordMutation.mutateAsync({ email });
      setMessage(res.message);
    } catch {
      setError("Não foi possível processar o pedido. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Building2 className="mx-auto h-8 w-8 text-primary" />
          <CardTitle>Esqueci minha senha</CardTitle>
          <p className="text-sm text-muted-foreground">
            Administrador da Company
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enviar link de recuperação
              </Button>
            </form>
          )}
          <div className="text-center">
            <Link
              href="/company-admin/login"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar pro login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
