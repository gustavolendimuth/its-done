import { MainLayout } from "@/components/layout/main-layout";
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
