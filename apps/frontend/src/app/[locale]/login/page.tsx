"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("auth.login");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent>
          <CardHeader></CardHeader>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
