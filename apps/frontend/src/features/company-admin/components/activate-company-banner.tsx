"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { usePublicActivationStatus } from "../company-admin-auth.service";

import { Button } from "@/components/ui/button";

interface ActivateCompanyBannerProps {
  companyId: string;
}

export function ActivateCompanyBanner({
  companyId,
}: ActivateCompanyBannerProps) {
  const t = useTranslations("companyActivation");
  const { data } = usePublicActivationStatus(companyId);

  // Hidden while loading, on error, and once the company has an admin.
  if (data?.hasActiveAdmin !== false) {
    return null;
  }

  return (
    <div className="bg-primary/5 border-b">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-medium">{t("bannerTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("bannerDescription")}
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link
            href={`/company-admin/activate/request?companyId=${encodeURIComponent(companyId)}`}
          >
            {t("bannerCta")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
