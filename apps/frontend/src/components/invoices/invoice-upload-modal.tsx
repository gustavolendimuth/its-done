import { useState } from "react";
import { InvoiceFileUpload } from "./invoice-file-upload";
import {
  useUploadInvoiceFile,
  useUpdateInvoice,
  Invoice,
} from "@/services/invoices";
import { toast } from "sonner";

interface InvoiceUploadModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InvoiceUploadModal({
  invoice,
  onClose,
  onSuccess,
}: InvoiceUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.number || "");
  const uploadFileMutation = useUploadInvoiceFile();
  const updateInvoiceMutation = useUpdateInvoice();

  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");

      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error("Please enter an invoice number");

      return;
    }

    setIsUploading(true);
    try {
      console.log("Starting upload process...");

      // Update invoice number if changed
      if (invoiceNumber && invoiceNumber !== invoice.number) {
        console.log("Updating invoice number to:", invoiceNumber);
        await updateInvoiceMutation.mutateAsync({
          id: invoice.id,
          data: { number: invoiceNumber },
        });
        console.log("Invoice number updated successfully");
      }

      console.log("Uploading file:", selectedFile.name);
      await uploadFileMutation.mutateAsync({
        id: invoice.id,
        file: selectedFile,
      });

      console.log("File uploaded successfully");
      toast.success("File uploaded successfully");
      setSelectedFile(null);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
        `Failed to upload file: ${(error as any)?.message || "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <InvoiceFileUpload
        invoiceNumber={invoiceNumber}
        onInvoiceNumberChange={setInvoiceNumber}
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
        isUploading={isUploading}
        onUpload={handleFileUpload}
        existingFileUrl={invoice.fileUrl || undefined}
        uploadButtonText="Upload Document"
        showInvoiceNumber={true}
        invoiceNumberPlaceholder="Enter invoice number"
        title="Upload Invoice Document"
        description="Upload the official invoice document for this invoice"
        compact={true}
      />
    </div>
  );
}
