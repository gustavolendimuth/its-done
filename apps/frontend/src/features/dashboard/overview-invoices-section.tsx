import { FileText } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClientInvoiceCard,
  FilterStatus,
  Invoice,
  InvoiceSearchFilters,
  SortBy,
} from "@/features/invoices";

export interface OverviewInvoicesSectionProps {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  searchTerm: string;
  sortBy: SortBy;
  filterStatus: FilterStatus;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortBy) => void;
  onStatusChange: (value: FilterStatus) => void;
}

export function OverviewInvoicesSection({
  invoices,
  filteredInvoices,
  searchTerm,
  sortBy,
  filterStatus,
  onSearchChange,
  onSortChange,
  onStatusChange,
}: OverviewInvoicesSectionProps) {
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
          onSearchChange={onSearchChange}
          onSortChange={onSortChange}
          onStatusChange={onStatusChange}
          totalResults={filteredInvoices.length}
          totalInvoices={invoices.length}
        />

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              invoices.length === 0 ? "No invoices yet" : "No matching invoices"
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
}
