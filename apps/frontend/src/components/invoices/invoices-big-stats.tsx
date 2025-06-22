"use client";

import {
  BigStatsDisplay,
  BigStatItem,
} from "@/components/ui/big-stats-display";
import {
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
} from "lucide-react";
import { useInvoiceStats } from "@/services/invoice-stats";

interface InvoicesBigStatsProps {
  className?: string;
  isRefetching?: boolean;
}

export function InvoicesBigStats({
  className,
  isRefetching = false,
}: InvoicesBigStatsProps) {
  const { data: stats } = useInvoiceStats();

  if (!stats) {
    return null;
  }

  // Calculate insights
  const paymentRate =
    stats.totalInvoices > 0 ? (stats.totalPaid / stats.totalAmount) * 100 : 0;

  const pendingAmount = stats.totalAmount - stats.totalPaid;
  const pendingRate =
    stats.totalInvoices > 0 ? (pendingAmount / stats.totalAmount) * 100 : 0;

  // Determine cash flow health
  const getCashFlowHealth = () => {
    if (paymentRate >= 80) return "Excellent";
    if (paymentRate >= 60) return "Good";
    if (paymentRate >= 40) return "Needs Attention";
    return "Critical";
  };

  // Stats for the display
  const statsItems: BigStatItem[] = [
    {
      title: "Payment Rate",
      value: `${paymentRate.toFixed(1)}%`,
      description: "of total invoiced",
      icon: CheckCircle,
    },
    {
      title: "Avg Invoice Value",
      value: `$${stats.totalInvoices > 0 ? (stats.totalAmount / stats.totalInvoices).toFixed(2) : "0.00"}`,
      description: "per invoice",
      icon: DollarSign,
    },
    {
      title: "Cash Flow Health",
      value: getCashFlowHealth(),
      description: "payment efficiency",
      icon: TrendingUp,
    },
  ];

  // Extra content with financial insights
  const extraContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-purple-100/50 dark:bg-purple-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Collection Goal
          </span>
        </div>
        <div className="text-sm text-purple-900 dark:text-purple-100 mb-2">
          {pendingAmount > 0
            ? `Collect $${pendingAmount.toFixed(2)} pending`
            : "All invoices collected!"}
        </div>
        <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.max(paymentRate, 5)}%`,
            }}
          />
        </div>
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
          Target: 90% collection rate • {paymentRate.toFixed(0)}%/90%
        </p>
      </div>

      <div className="bg-purple-100/50 dark:bg-purple-800/20 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-1">
          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Revenue Insights
          </span>
        </div>
        <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
          {stats.totalAmount > 10000
            ? "High Volume"
            : stats.totalAmount > 5000
              ? "Growing"
              : stats.totalAmount > 1000
                ? "Developing"
                : "Starting"}
        </div>
        <p className="text-xs text-purple-700 dark:text-purple-300">
          ${stats.totalAmount.toFixed(2)} total revenue
        </p>
      </div>
    </div>
  );

  return (
    <BigStatsDisplay
      title="Invoice Management"
      subtitle="Financial performance overview"
      icon={FileText}
      mainValue={`$${stats.totalAmount.toFixed(2)}`}
      secondaryValue={`${stats.totalInvoices} invoices • $${stats.totalPaid.toFixed(2)} collected`}
      stats={statsItems}
      variant="purple"
      isRefetching={isRefetching}
      className={className}
      extraContent={extraContent}
    />
  );
}
