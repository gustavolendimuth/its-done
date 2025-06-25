"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { InfoCard } from "@/components/ui/info-card";
import { useTimeEntries } from "@/services/time-entries";
import { useInvoices } from "@/services/invoices";
import { useClients } from "@/services/clients";
import { useWorkHoursStats } from "@/services/work-hours-stats";
import { Overview, OverviewData } from "@/components/dashboard/overview";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

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

  const { isLoading: statsLoading } = useWorkHoursStats({
    from: period.from,
    to: period.to,
  });

  const isLoading =
    entriesLoading || invoicesLoading || clientsLoading || statsLoading;

  // Prepare data for Overview component
  const overviewData: OverviewData = useMemo(() => {
    if (isLoading) {
      return {
        stats: {
          totalHours: 0,
          totalInvoices: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          paidInvoices: 0,
          pendingInvoices: 0,
          canceledInvoices: 0,
          averageInvoiceValue: 0,
          monthlyGrowth: 0,
        },
        invoices: [],
      };
    }

    // Calculate stats
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0
    );
    const paidAmount = invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const pendingAmount = invoices
      .filter((inv) => inv.status === "PENDING")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const paidInvoices = invoices.filter((inv) => inv.status === "PAID").length;
    const pendingInvoices = invoices.filter(
      (inv) => inv.status === "PENDING"
    ).length;
    const canceledInvoices = invoices.filter(
      (inv) => inv.status === "CANCELED"
    ).length;

    const averageInvoiceValue =
      totalInvoices > 0 ? totalAmount / totalInvoices : 0;

    // Sort invoices by date and get recent ones
    const recentInvoices = invoices
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    // Calculate top clients by hours worked
    const clientHours = timeEntries.reduce(
      (acc, entry) => {
        const clientId = entry.clientId;

        if (!acc[clientId]) {
          const client = clients.find((c) => c.id === clientId);

          acc[clientId] = {
            id: clientId,
            name: client?.name || "Unknown Client",
            company: client?.company || "",
            hours: 0,
            invoices: 0,
          };
        }
        acc[clientId].hours += entry.hours;

        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          name: string;
          company: string;
          hours: number;
          invoices: number;
        }
      >
    );

    // Add invoice counts to clients
    invoices.forEach((invoice) => {
      if (clientHours[invoice.clientId]) {
        clientHours[invoice.clientId].invoices++;
      }
    });

    return {
      stats: {
        totalHours,
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        paidInvoices,
        pendingInvoices,
        canceledInvoices,
        averageInvoiceValue,
        monthlyGrowth: 12.5, // Mock growth percentage
      },
      invoices: recentInvoices,
    };
  }, [timeEntries, invoices, clients, isLoading]);

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={BarChart3}
      />

      <InfoCard
        title={t("infoTitle")}
        description={`${t("description")} - ${format(new Date(), "MMMM yyyy")}`}
        variant="info"
        className="mb-6"
      />

      <Overview data={overviewData} isLoading={isLoading} className="mt-6" />
    </PageContainer>
  );
}
