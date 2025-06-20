"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Download,
  Eye,
  Trash2,
  Edit,
  Clock,
  Calendar,
  Upload,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form";
import { EditInvoiceForm } from "@/components/invoices/edit-invoice-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { useInvoices, useDeleteInvoice, Invoice } from "@/services/invoices";
import { useClients, Client } from "@/services/clients";

import { useInvoiceStats } from "@/services/invoice-stats";
import { InvoiceUploadModal } from "@/components/invoices/invoice-upload-modal";
import { StatsCard } from "@/components/ui/stats-card";
import { InvoiceCard } from "@/components/invoices/invoice-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { InfoCard } from "@/components/ui/info-card";
import { FormModal } from "@/components/ui/form-modal";
import {
  InvoiceSearchFilters,
  useInvoiceFilters,
} from "@/components/invoices/invoice-search-filters";

export default function InvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadInvoice, setUploadInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading, error } = useInvoices();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  // Invoice filters
  const {
    searchTerm,
    sortBy,
    filterStatus,
    filteredInvoices,
    setSearchTerm,
    setSortBy,
    setFilterStatus,
  } = useInvoiceFilters(invoices);

  const { data: stats } = useInvoiceStats();
  const deleteInvoice = useDeleteInvoice();

  const getStatusBadgeVariant = (status: Invoice["status"]) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PENDING":
        return "outline";
      case "CANCELED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success("Invoice deleted successfully");
    } catch (error) {
      toast.error("Failed to delete invoice");
      console.error("Delete invoice error:", error);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  if (isLoading || clientsLoading) {
    return <LoadingSkeleton type="stats" />;
  }

  if (error) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileText}
          title="Error loading invoices"
          description="There was an error loading your invoices. Please try again."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Manage your invoices and billing. Select multiple work hours to create invoices."
        icon={FileText}
        actions={[
          {
            label: "Create Invoice",
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Feature Info Card */}
      <InfoCard
        title="Enhanced Invoice Creation"
        description="Now you can select multiple work hours from one or several projects to create a single invoice. Choose work hours by client or project, set your hourly rate, and automatically calculate the total amount."
        variant="info"
        className="mb-6"
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Invoices"
            value={Math.round(stats.totalInvoices)}
            icon={FileText}
            variant="blue"
          />

          <StatsCard
            title="Total Amount"
            value={`$${stats.totalAmount.toFixed(2)}`}
            icon={DollarSign}
            variant="green"
          />

          <StatsCard
            title="Paid Invoices"
            value={`$${stats.totalPaid.toFixed(2)}`}
            icon={CheckCircle}
            variant="purple"
          />

          <StatsCard
            title="Pending"
            value={`$${(stats.totalAmount - stats.totalPaid).toFixed(2)}`}
            icon={Clock}
            variant="yellow"
          />
        </div>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice by selecting work hours from your time entries"
          actions={[
            {
              label: "Create Your First Invoice",
              icon: Plus,
              onClick: () => setIsCreateDialogOpen(true),
            },
          ]}
        />
      ) : (
        <>
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
            className="mb-6"
          />

          {/* Invoices Grid */}
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No matching invoices"
              description="Try adjusting your search or filter criteria"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  id={invoice.id}
                  number={invoice.number}
                  clientName={invoice.client?.name}
                  clientEmail={invoice.client?.email}
                  amount={invoice.amount}
                  status={invoice.status}
                  createdAt={invoice.createdAt}
                  fileUrl={invoice.fileUrl}
                  onEdit={() => handleEditInvoice(invoice)}
                  onDelete={handleDelete}
                  onUpload={(id) => {
                    setUploadInvoice(invoice);
                    setIsUploadDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Invoice Dialog */}
      <FormModal
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create New Invoice"
        description="Select work hours and create an invoice for a client"
        icon={FileText}
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
      >
        <CreateInvoiceForm
          clients={clients}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            toast.success("Invoice created successfully");
          }}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </FormModal>

      {/* Edit Invoice Dialog */}
      <FormModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Invoice"
        description="Update invoice details, amounts and associated work hours"
        icon={Edit}
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
      >
        {selectedInvoice && (
          <EditInvoiceForm
            invoice={selectedInvoice}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              setSelectedInvoice(null);
            }}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </FormModal>

      {/* Upload Dialog */}
      <FormModal
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        title="Upload Invoice File"
        description="Upload the official invoice document (PDF, DOC, or image files)"
        icon={Upload}
        className="sm:max-w-[600px]"
      >
        {uploadInvoice && (
          <InvoiceUploadModal
            invoice={uploadInvoice}
            onClose={() => {
              setIsUploadDialogOpen(false);
              setUploadInvoice(null);
            }}
            onSuccess={() => {
              setIsUploadDialogOpen(false);
              setUploadInvoice(null);
            }}
          />
        )}
      </FormModal>
    </PageContainer>
  );
}
