"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const tCommon = useTranslations("common");
  const [success, setSuccess] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  const forgotPasswordSchema = z.object({
    email: z.string().email(tCommon("invalidEmail")),
  });

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Tratamento para erro de listener assíncrono (problema comum com extensões do browser)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes("message channel closed") ||
        event.message.includes("listener indicated an asynchronous response")
      ) {
        console.warn("🔇 Suppressing browser extension error:", event.message);
        event.preventDefault();

        return true;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes("message channel closed")) {
        console.warn(
          "🔇 Suppressing promise rejection from browser extension:",
          event.reason.message
        );
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      console.log("🔄 Iniciando processo de reset de senha para:", data.email);
      await forgotPasswordMutation.mutateAsync(data);
      console.log("✅ Reset de senha processado com sucesso");
      setSuccess(true);
    } catch (error) {
      console.error("❌ Erro no reset de senha:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>{tCommon("success")}</AlertDescription>
                </Alert>
                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("backToLogin")}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {forgotPasswordMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {(forgotPasswordMutation.error as any)?.response?.data
                        ?.message || tCommon("errorOccurred")}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={tCommon("email")}
                    {...register("email")}
                    disabled={forgotPasswordMutation.isPending}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full"
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tCommon("loading")}
                    </>
                  ) : (
                    t("sendLink")
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("backToLogin")}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
