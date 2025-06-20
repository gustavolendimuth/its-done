"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AuthCallback() {
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
        <h1 className="text-2xl font-bold mb-4">Autenticando...</h1>
        <p>Por favor, aguarde enquanto redirecionamos você.</p>
      </div>
    </div>
  );
}
