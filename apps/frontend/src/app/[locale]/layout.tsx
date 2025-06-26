import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { locales } from "@/i18n/request";
import { Providers } from "@/providers/providers";

import type { Metadata } from "next";
import "../globals.css";
import "react-day-picker/dist/style.css";

export const metadata: Metadata = {
  title: "It's Done - Professional Time Tracking",
  description:
    "A professional time tracking application for contractors and teams",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
