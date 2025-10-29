import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
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
import { useAvailableTimeEntries } from "@/services/time-entries";
import { TimeEntry } from "@/types";

import { InvoiceFileUpload } from "./invoice-file-upload";
import { WorkHoursSelectionSummary } from "./work-hours-selection-summary";
import { WorkHoursSelector } from "./work-hours-selector";



const editInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "PAID", "CANCELED"]),
  description: z.string().optional(),
  workHourIds: z.array(z.string()).optional(),
  amount: z.number().min(0).optional(),
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
  const t = useTranslations("invoices");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.number || "");

  // Work hours selection states
  const [selectedWorkHourIds, setSelectedWorkHourIds] = useState<string[]>([]);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(invoice.amount || 0);

  const updateInvoiceMutation = useUpdateInvoice();
  const uploadFileMutation = useUploadInvoiceFile();

  // Fetch available time entries for the invoice's client
  const { data: availableTimeEntries = [] } = useAvailableTimeEntries({
    clientId: invoice.clientId,
  });

  // Extract currently associated work hours from invoice
  const currentWorkHours: TimeEntry[] = (invoice.invoiceWorkHours || []).map(
    (iwh) => iwh.workHour as TimeEntry
  );

  // Combine available entries with current ones (removing duplicates)
  const currentWorkHourIds = currentWorkHours.map((wh) => wh.id);
  const filteredAvailableEntries = availableTimeEntries.filter(
    (entry: TimeEntry) =>
      !currentWorkHourIds.includes(entry.id) && !entry.invoiceWorkHours?.length
  );

  const allAvailableEntries = [...currentWorkHours, ...filteredAvailableEntries];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditInvoiceFormData>({
    resolver: zodResolver(editInvoiceSchema),
    defaultValues: {
      status: invoice.status as "DRAFT" | "PENDING" | "PAID" | "CANCELED",
      description: invoice.description || "",
      workHourIds: currentWorkHourIds,
      amount: invoice.amount,
    },
  });

  // Initialize selected work hours from invoice
  useEffect(() => {
    const initialIds = currentWorkHours.map((wh) => wh.id);
    setSelectedWorkHourIds(initialIds);

    const initialAmount = currentWorkHours.reduce((sum, entry) => {
      const rate = entry.project?.hourlyRate ?? 0;
      return sum + entry.hours * rate;
    }, 0);
    setCalculatedAmount(initialAmount);
  }, [invoice.id]);

  const handleWorkHoursSelection = (
    workHourIds: string[],
    totalAmount: number
  ) => {
    setSelectedWorkHourIds(workHourIds);
    setCalculatedAmount(totalAmount);
    setValue("workHourIds", workHourIds);
    setValue("amount", totalAmount);
  };

  const selectedEntries = allAvailableEntries.filter((entry) =>
    selectedWorkHourIds.includes(entry.id)
  );

  const totalHours = selectedEntries.reduce(
    (sum: number, entry: TimeEntry) => sum + entry.hours,
    0
  );

  const onSubmit = async (data: EditInvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        data: {
          status: data.status,
          description: data.description,
          workHourIds: data.workHourIds,
          amount: data.amount,
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
                  <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                  <SelectItem value="PENDING">{t("pending")}</SelectItem>
                  <SelectItem value="PAID">{t("paid")}</SelectItem>
                  <SelectItem value="CANCELED">{t("cancelled")}</SelectItem>
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

        {/* Work Hours Selection */}
        <div className="space-y-2">
          <Label>Work Hours</Label>
          <div className="space-y-4">
            {/* Selection Summary (top) */}
            <WorkHoursSelectionSummary
              totalHours={totalHours}
              totalAmount={calculatedAmount}
            />

            {/* Work Hours Selector */}
            {allAvailableEntries.length > 0 ? (
              <WorkHoursSelector
                key={`${invoice.clientId}-${invoice.id}`}
                timeEntries={allAvailableEntries}
                initialSelectedIds={selectedWorkHourIds}
                onSelectionChange={(workHourIds, totalAmount) =>
                  handleWorkHoursSelection(workHourIds, totalAmount)
                }
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No work hours available for this client</p>
              </div>
            )}
          </div>
          {errors.workHourIds && (
            <p className="text-sm text-red-500">{errors.workHourIds.message}</p>
          )}
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
