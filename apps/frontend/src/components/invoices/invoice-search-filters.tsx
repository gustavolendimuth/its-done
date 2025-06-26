"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Invoice } from "@/services/invoices";

export type SortBy = "date" | "amount" | "status" | "hours";
export type FilterStatus = "ALL" | "PAID" | "PENDING" | "CANCELED";

export interface InvoiceFilters {
  searchTerm: string;
  sortBy: SortBy;
  filterStatus: FilterStatus;
}

export interface InvoiceSearchFiltersProps {
  searchTerm: string;
  sortBy: SortBy;
  filterStatus: FilterStatus;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortBy) => void;
  onStatusChange: (value: FilterStatus) => void;
  totalResults: number;
  totalInvoices: number;
  className?: string;
}

export function InvoiceSearchFilters({
  searchTerm,
  sortBy,
  filterStatus,
  onSearchChange,
  onSortChange,
  onStatusChange,
  totalResults,
  totalInvoices,
  className,
}: InvoiceSearchFiltersProps) {
  return (
    <div className={className}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices by number or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select
          value={filterStatus}
          onValueChange={(value: FilterStatus) => onStatusChange(value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value: SortBy) => onSortChange(value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="hours">Hours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>
          Showing {totalResults} of {totalInvoices} invoices
        </span>
        {searchTerm && <span>Search: &quot;{searchTerm}&quot;</span>}
      </div>
    </div>
  );
}

// Hook para usar os filtros com lógica de filtragem
export function useInvoiceFilters(invoices: Invoice[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const filteredInvoices = invoices
    .filter((invoice) => {
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();

        return (
          (invoice.number &&
            invoice.number.toLowerCase().includes(searchLower)) ||
          invoice.id.toLowerCase().includes(searchLower) ||
          (invoice.description &&
            invoice.description.toLowerCase().includes(searchLower)) ||
          (invoice.client?.name &&
            invoice.client.name.toLowerCase().includes(searchLower))
        );
      }

      return true;
    })
    .filter((invoice) => {
      // Filter by status
      if (filterStatus !== "ALL") {
        return invoice.status.toUpperCase() === filterStatus;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort
      switch (sortBy) {
        case "date":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "amount":
          return (b.amount || 0) - (a.amount || 0);
        case "status":
          return a.status.localeCompare(b.status);
        case "hours":
          const aHours =
            a.invoiceWorkHours?.reduce(
              (sum: number, iwh) => sum + (iwh.workHour?.hours || 0),
              0
            ) || 0;
          const bHours =
            b.invoiceWorkHours?.reduce(
              (sum: number, iwh) => sum + (iwh.workHour?.hours || 0),
              0
            ) || 0;

          return bHours - aHours;
        default:
          return 0;
      }
    });

  return {
    searchTerm,
    sortBy,
    filterStatus,
    filteredInvoices,
    setSearchTerm,
    setSortBy,
    setFilterStatus,
  };
}
