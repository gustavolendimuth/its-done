import { MainLayout } from "@/components/layout/main-layout";
// Direct file import (not the feature barrel): this layout is a Server
// Component, and importing a Client Component through the barrel index.ts
// confuses Next.js/Turbopack's server/client boundary detection, pulling
// client-only hooks (useState, react-hook-form) into the server bundle.
import { WorkTimerWidget } from "@/features/time-tracking/components/work-timer-widget";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      {children}
      <WorkTimerWidget />
    </MainLayout>
  );
}
