"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

function AuthCallbackContent() {
  const t = useTranslations("auth.callback");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Sign in with the token
      signIn("credentials", {
        token,
        redirect: false,
      }).then((result) => {
        if (result?.ok) {
          router.push("/");
        } else {
          router.push("/login");
        }
      });
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{t("authenticating")}</h1>
        <p>{t("pleaseWait")}</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  const t = useTranslations("auth.callback");

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{t("loading")}</h1>
            <p>{t("pleaseWait")}</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
