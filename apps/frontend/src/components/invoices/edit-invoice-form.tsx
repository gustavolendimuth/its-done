import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Invoice,
  useUpdateInvoice,
  useUploadInvoiceFile,
} from "@/services/invoices";

import { InvoiceFileUpload } from "./invoice-file-upload";



const editInvoiceSchema = z.object({
  status: z.enum(["PENDING", "PAID", "CANCELED"]),
  description: z.string().optional(),
});

type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>;

interface EditInvoiceFormProps {
  invoice: Invoice;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditInvoiceForm({
  invoice,
  onSuccess,
  onCancel,
}: EditInvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.number || "");

  const updateInvoiceMutation = useUpdateInvoice();
  const uploadFileMutation = useUploadInvoiceFile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditInvoiceFormData>({
    resolver: zodResolver(editInvoiceSchema),
    defaultValues: {
      status: invoice.status as "PENDING" | "PAID" | "CANCELED",
      description: invoice.description || "",
    },
  });

  const onSubmit = async (data: EditInvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: {
          status: data.status,
          description: data.description,
        },
      });

      toast.success("Invoice updated successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");

      return;
    }

    setIsUploading(true);
    try {
      // Update invoice number if changed and provided
      if (invoiceNumber && invoiceNumber !== invoice.number) {
        await updateInvoiceMutation.mutateAsync({
          id: invoice.id,
          data: { number: invoiceNumber },
        });
      }

      // Upload file
      await uploadFileMutation.mutateAsync({
        id: invoice.id,
        file: selectedFile,
      });

      toast.success("File uploaded successfully");
      setSelectedFile(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Additional notes or description for this invoice..."
            {...register("description")}
          />
        </div>

        {/* File Upload */}
        <div className="pt-2">
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
            invoiceNumberPlaceholder="Enter invoice number (optional)"
            title="Upload Invoice Document"
            description="Upload the official invoice document after generating it from the tax authority website (optional)"
            compact={false}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
