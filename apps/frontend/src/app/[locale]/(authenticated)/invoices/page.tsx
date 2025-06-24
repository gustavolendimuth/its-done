"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  Plus,
  FileText,
} from "lucide-react";
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form";
import { EditInvoiceForm } from "@/components/invoices/edit-invoice-form";

import { toast } from "sonner";
import { useInvoices, useDeleteInvoice, Invoice } from "@/services/invoices";
import { useClients } from "@/services/clients";

import { useInvoiceStats } from "@/services/invoice-stats";
import { InvoiceUploadModal } from "@/components/invoices/invoice-upload-modal";
import { InvoicesBigStats } from "@/components/invoices/invoices-big-stats";
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
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
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
      toast.success(t("deleteSuccess"));
    } catch (error) {
      toast.error(tCommon("errorOccurred"));
      console.error("Delete invoice error:", error);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  if (isLoading || clientsLoading) {
    return <LoadingSkeleton type="invoices-page" />;
  }

  if (error) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileText}
          title={tCommon("error")}
          description={tCommon("errorOccurred")}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={FileText}
        actions={[
          {
            label: t("createInvoice"),
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Feature Info Card */}
      <InfoCard
        title={t("infoTitle")}
        description={t("description")}
        variant="info"
        className="mb-6"
      />

      {/* Big Stats Display */}
      <InvoicesBigStats className="mb-8" />

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("noInvoicesFound")}
          description={t("createFirst")}
          actions={[
            {
              label: t("createInvoice"),
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
              title={t("noInvoicesFound")}
              description={tCommon("tryAgain")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  id={invoice.id}
                  number={invoice.number}
                  clientName={
                    clients.find((c) => c.id === invoice.clientId)?.name
                  }
                  clientEmail={
                    clients.find((c) => c.id === invoice.clientId)?.email
                  }
                  amount={invoice.amount}
                  status={invoice.status}
                  createdAt={invoice.createdAt}
                  fileUrl={invoice.fileUrl}
                  onEdit={(id) => handleEditInvoice(invoice)}
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
        title={t("createInvoice")}
        description={t("createInvoiceFormSubtitle")}
        icon={FileText}
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
      >
        <CreateInvoiceForm
          onSuccess={() => setIsCreateDialogOpen(false)}
          clients={clients}
        />
      </FormModal>

      {/* Edit Invoice Dialog */}
      {selectedInvoice && (
        <FormModal
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title={t("edit")}
          description={t("editInvoiceFormSubtitle")}
          icon={FileText}
          className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        >
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
        </FormModal>
      )}

      {/* Upload Invoice Document Dialog */}
      {uploadInvoice && isUploadDialogOpen && (
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
    </PageContainer>
  );
}
