"use client";

import { SettingsForm } from "@/components/settings/settings-form";
import { Settings } from "lucide-react";
import { InfoCard } from "@/components/ui/info-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Settings"
        description="Configure your notification preferences and work hour limits"
        icon={Settings}
      />

      {/* Feature Info Card */}
      <InfoCard
        title="Customize Your Experience"
        description="Configure your notification preferences and work hour limits. Set up automatic email alerts when you reach your configured hour thresholds to stay on top of your productivity goals. All settings are saved automatically and synced across your devices."
        variant="info"
        className="mb-8"
      />

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-6">
            Notification Preferences
          </h2>
          <SettingsForm />
        </div>
      </div>
    </PageContainer>
  );
}
