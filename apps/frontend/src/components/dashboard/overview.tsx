"use client";


import { format } from "date-fns";
import {
  Clock,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Building2,
  Mail,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";

import { ClientInvoiceCard } from "@/components/invoices/client-invoice-card";
import {
  InvoiceSearchFilters,
  SortBy,
  FilterStatus,
} from "@/components/invoices/invoice-search-filters";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { formatHoursToHHMM, cn } from "@/lib/utils";
import { Invoice } from "@/services/invoices";

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
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(
        (invoice) => invoice.status.toUpperCase() === filterStatus
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
              0
            ) || 0;
          const bHours =
            b.invoiceWorkHours?.reduce(
              (sum: number, iwh: { workHour?: { hours: number } }) =>
                sum + (iwh.workHour?.hours || 0),
              0
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

  const renderHeader = () => {
    if (clientInfo) {
      return (
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">
                  {clientInfo.name} Dashboard
                </h1>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  {clientInfo.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{clientInfo.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Last updated {format(new Date(), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderMainStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Invoices"
          value={stats.totalInvoices}
          description="All time invoices"
          icon={FileText}
          variant="blue"
        />

        <StatsCard
          title="Total Hours"
          value={formatHoursToHHMM(stats.totalHours)}
          description="Hours worked"
          icon={Clock}
          variant="green"
        />

        <StatsCard
          title="Total Amount"
          value={`$${stats.totalAmount.toFixed(2)}`}
          description={`Avg: $${stats.averageInvoiceValue.toFixed(2)}`}
          icon={DollarSign}
          variant="purple"
        />

        <StatsCard
          title="Paid Amount"
          value={`$${stats.paidAmount.toFixed(2)}`}
          description={`${stats.paidInvoices} invoices paid`}
          icon={CheckCircle}
          variant="orange"
        />
      </div>
    );
  };

  const renderPerformanceCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Monthly Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-2xl font-bold ${
                  stats.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.monthlyGrowth >= 0 ? "+" : ""}
                {stats.monthlyGrowth.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">
                ${stats.pendingAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingInvoices} pending invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-green-600">
                  {stats.paidInvoices}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-yellow-600">
                  {stats.pendingInvoices}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Canceled</span>
                <span className="font-medium text-red-600">
                  {stats.canceledInvoices}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInvoicesSection = () => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Invoices</CardTitle>
          <CardDescription>Manage and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <InvoiceSearchFilters
            searchTerm={searchTerm}
            sortBy={sortBy}
            filterStatus={filterStatus}
            onSearchChange={setSearchTerm}
            onSortChange={setSortBy}
            onStatusChange={setFilterStatus}
            totalResults={filteredInvoices.length}
            totalInvoices={invoices.length}
          />

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                invoices.length === 0
                  ? "No invoices yet"
                  : "No matching invoices"
              }
              description={
                invoices.length === 0
                  ? "Your invoices will appear here once they are created"
                  : "Try adjusting your search or filter criteria"
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <ClientInvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {renderHeader()}

      <div className="container mx-auto px-4 py-6">
        {/* Main Stats */}
        <div className="mb-8">{renderMainStats()}</div>

        {/* Performance Cards */}
        {renderPerformanceCards()}

        {/* Invoices Section */}
        {renderInvoicesSection()}
      </div>
    </div>
  );
}
