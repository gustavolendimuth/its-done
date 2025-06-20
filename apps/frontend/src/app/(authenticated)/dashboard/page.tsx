"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Clock, BarChart3 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { InfoCard } from "@/components/ui/info-card";
import { useTimeEntries } from "@/services/time-entries";
import { useInvoices } from "@/services/invoices";
import { useClients } from "@/services/clients";
import { useWorkHoursStats } from "@/services/work-hours-stats";
import { Overview, OverviewData } from "@/components/dashboard/overview";

export default function DashboardPage() {
  // Period for current month
  const [period] = useState({
    from: startOfMonth(new Date()).toISOString(),
    to: endOfMonth(new Date()).toISOString(),
  });

  // Fetch data
  const { data: timeEntries = [], isLoading: entriesLoading } = useTimeEntries({
    from: period.from,
    to: period.to,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices({
    from: period.from,
    to: period.to,
  });

  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const { data: stats, isLoading: statsLoading } = useWorkHoursStats({
    from: period.from,
    to: period.to,
  });

  const isLoading =
    entriesLoading || invoicesLoading || clientsLoading || statsLoading;

  // Calculate totals for overview
  const overviewData: OverviewData = useMemo(() => {
    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0
    );
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

    const paidInvoices = invoices.filter(
      (inv) => inv.status.toUpperCase() === "PAID"
    );
    const pendingInvoices = invoices.filter(
      (inv) => inv.status.toUpperCase() === "PENDING"
    );
    const canceledInvoices = invoices.filter(
      (inv) => inv.status.toUpperCase() === "CANCELED"
    );

    const paidAmount = paidInvoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0
    );
    const pendingAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0
    );

    return {
      invoices,
      stats: {
        totalInvoices: invoices.length,
        totalAmount,
        totalHours,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
        canceledInvoices: canceledInvoices.length,
        paidAmount,
        pendingAmount,
        monthlyGrowth: 0, // TODO: Calculate based on previous month data
        averageInvoiceValue:
          invoices.length > 0 ? totalAmount / invoices.length : 0,
      },
      clientInfo: {
        name: "Internal Dashboard",
        email: "admin@company.com",
      },
    };
  }, [timeEntries, invoices]);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Your work summary and recent activity"
        icon={BarChart3}
      >
        <div className="text-sm text-muted-foreground">
          {format(new Date(), "MMMM yyyy")}
        </div>
      </PageHeader>

      {/* Feature Info Card */}
      <InfoCard
        title="Professional Work Hours Tracking"
        description="Monitor your productivity with real-time insights. Track hours across clients, generate automated reports, and get instant notifications when you reach your configured work limits. All data is organized by month and client for easy analysis."
        variant="info"
        className="mb-6"
      />

      {/* Overview Component */}
      <Overview data={overviewData} isLoading={isLoading} />
    </PageContainer>
  );
}
