"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { InfoCard } from "@/components/ui/info-card";

export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader title={t("title")} subtitle={t("subtitle")} icon={Settings} />

      {/* Feature Info Card */}
      <InfoCard
        title={t("infoTitle")}
        description={t("description")}
        variant="info"
        className="mb-8"
      />

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">{t("preferences")}</h2>
          <SettingsForm />
        </div>
      </div>
    </PageContainer>
  );
}
