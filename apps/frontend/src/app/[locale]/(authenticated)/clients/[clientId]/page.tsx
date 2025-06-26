"use client";

import { useQuery } from "@tanstack/react-query";
import { subMonths, isAfter, isBefore } from "date-fns";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { Overview, OverviewData } from "@/components/dashboard/overview";
import { invoicesService } from "@/services/invoices";

export default function ClientDetailPage() {
  const { clientId } = useParams();

  const {
    data: invoices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clientInvoices", clientId],
    queryFn: () => invoicesService.findByClient(clientId as string),
    enabled: !!clientId,
  });

  // Prepare data for overview
  const overviewData: OverviewData = useMemo(() => {
    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0
    );
    const totalHours = invoices.reduce((sum, invoice) => {
      const invoiceHours =
        invoice.invoiceWorkHours?.reduce(
          (hourSum, iwh) => hourSum + (iwh.workHour?.hours || 0),
          0
        ) || 0;

      return sum + invoiceHours;
    }, 0);

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
      (sum, invoice) => sum + invoice.amount,
      0
    );
    const pendingAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0
    );

    // Calculate monthly trend
    const lastMonth = subMonths(new Date(), 1);
    const thisMonthInvoices = invoices.filter((inv) =>
      isAfter(new Date(inv.createdAt), lastMonth)
    );
    const previousMonthInvoices = invoices.filter(
      (inv) =>
        isBefore(new Date(inv.createdAt), lastMonth) &&
        isAfter(new Date(inv.createdAt), subMonths(new Date(), 2))
    );

    const thisMonthAmount = thisMonthInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );
    const previousMonthAmount = previousMonthInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );

    const monthlyGrowth =
      previousMonthAmount === 0
        ? thisMonthAmount > 0
          ? 100
          : 0
        : ((thisMonthAmount - previousMonthAmount) / previousMonthAmount) * 100;

    const clientName = invoices[0]?.client?.name || "Client";
    const clientEmail = invoices[0]?.client?.email || "";

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
        monthlyGrowth,
        averageInvoiceValue:
          invoices.length > 0 ? totalAmount / invoices.length : 0,
      },
      clientInfo: {
        name: clientName,
        email: clientEmail,
      },
    };
  }, [invoices]);

  return <Overview data={overviewData} isLoading={isLoading} error={error} />;
}
