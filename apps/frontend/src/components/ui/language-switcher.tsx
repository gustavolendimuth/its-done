"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type Locale = "en" | "pt-BR";

const locales: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
];

export function LanguageSwitcher() {
  const t = useTranslations("settings");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove o locale atual do pathname (en ou pt-BR)
    const pathWithoutLocale = pathname.replace(/^\/(?:en|pt-BR)/, "");

    // Criar a nova URL com o novo locale
    const newPath = `/${newLocale}${pathWithoutLocale || "/"}`;

    router.push(newPath);
  };

  const currentLocale = locales.find((l) => l.value === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">{currentLocale?.flag}</span>
          <span className="sr-only">{t("language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((localeOption) => (
          <DropdownMenuItem
            key={localeOption.value}
            onClick={() => handleLocaleChange(localeOption.value)}
            className={`gap-2 ${locale === localeOption.value ? "bg-accent" : ""}`}
          >
            <span>{localeOption.flag}</span>
            <span>{localeOption.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
