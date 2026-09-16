"use client";

import { XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { OverviewHeader } from "./overview-header";
import { OverviewInvoicesSection } from "./overview-invoices-section";
import { OverviewMainStats } from "./overview-main-stats";
import { OverviewPerformanceCards } from "./overview-performance-cards";

import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { FilterStatus, Invoice, SortBy } from "@/features/invoices";
import { cn } from "@/lib/utils";

// Types
export interface OverviewStats {
  totalInvoices: number;
  totalHours: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidInvoices: number;
  pendingInvoices: number;
  canceledInvoices: number;
  averageInvoiceValue: number;
  monthlyGrowth: number;
}

export interface OverviewData {
  invoices: Invoice[];
  stats: OverviewStats;
  clientInfo?: {
    name: string;
    email?: string;
    company?: string;
  };
}

export interface OverviewProps {
  data: OverviewData;
  isLoading: boolean;
  error?: Error | null;
  className?: string;
}

export function Overview({ data, isLoading, error, className }: OverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const { invoices, stats, clientInfo } = data;

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          (invoice.number &&
            invoice.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice.description &&
            invoice.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      );
    }

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(
        (invoice) => invoice.status.toUpperCase() === filterStatus,
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "amount":
          return b.amount - a.amount;
        case "status":
          return a.status.localeCompare(b.status);
        case "hours":
          const aHours =
            a.invoiceWorkHours?.reduce(
              (sum: number, iwh: { workHour?: { hours: number } }) =>
                sum + (iwh.workHour?.hours || 0),
              0,
            ) || 0;
          const bHours =
            b.invoiceWorkHours?.reduce(
              (sum: number, iwh: { workHour?: { hours: number } }) =>
                sum + (iwh.workHour?.hours || 0),
              0,
            ) || 0;

          return bHours - aHours;
        default:
          return 0;
      }
    });

    return filtered;
  }, [invoices, searchTerm, filterStatus, sortBy]);

  if (isLoading) {
    return <LoadingSkeleton type="stats" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Error loading dashboard
              </h3>
              <p className="text-muted-foreground">
                Unable to load data. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <OverviewHeader clientInfo={clientInfo} />

      <div className="container mx-auto px-4 py-6">
        {/* Main Stats */}
        <div className="mb-8">
          <OverviewMainStats stats={stats} />
        </div>

        {/* Performance Cards */}
        <OverviewPerformanceCards stats={stats} />

        {/* Invoices Section */}
        <OverviewInvoicesSection
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          searchTerm={searchTerm}
          sortBy={sortBy}
          filterStatus={filterStatus}
          onSearchChange={setSearchTerm}
          onSortChange={setSortBy}
          onStatusChange={setFilterStatus}
        />
      </div>
    </div>
  );
}
