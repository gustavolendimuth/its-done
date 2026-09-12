import { MainLayout } from "@/components/layout/main-layout";
import { WorkTimerWidget } from "@/components/work-timer/work-timer-widget";

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
