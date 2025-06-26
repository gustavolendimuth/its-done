import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Locales suportados
export const locales = ["en", "pt-BR"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // Obter o locale da requisição
  const locale = await requestLocale;

  // Validar se o locale fornecido é válido
  if (!locale || !locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
