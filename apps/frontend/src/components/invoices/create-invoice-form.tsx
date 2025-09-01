import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Clock, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatHoursToHHMM } from "@/lib/utils";
import { Client } from "@/services/clients";
import { useCreateInvoice, useUploadInvoiceFile } from "@/services/invoices";
import { useAvailableTimeEntries } from "@/services/time-entries";
import { TimeEntry } from "@/types";

import { InvoiceFileUpload } from "./invoice-file-upload";
import { WorkHoursSelectionSummary } from "./work-hours-selection-summary";
import { WorkHoursSelector } from "./work-hours-selector";

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  workHourIds: z
    .array(z.string())
    .min(1, "At least one work hour must be selected"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  hourlyRate: z.number().min(0, "Hourly rate must be 0 or greater").optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "CANCELED"]).optional(),
  invoiceNumber: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface CreateInvoiceFormProps {
  clients: Client[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateInvoiceForm({
  clients,
  onSuccess,
  onCancel,
}: CreateInvoiceFormProps) {
  const [selectedWorkHourIds, setSelectedWorkHourIds] = useState<string[]>([]);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload states
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      hourlyRate: 50,
      amount: 0,
      invoiceNumber: "",
    },
  });

  const watchedClientId = watch("clientId");
  const watchedHourlyRate = watch("hourlyRate");

  // Buscar horas disponíveis (não faturadas ou de faturas canceladas)
  const { data: availableTimeEntries = [] } = useAvailableTimeEntries({
    clientId: watchedClientId,
  });

  // As horas já vêm filtradas pelo clientId se fornecido
  const filteredTimeEntries =
    availableTimeEntries.filter(
      (entry: TimeEntry) => !entry.invoiceWorkHours?.length
    ) || [];

  const selectedEntries = filteredTimeEntries.filter((entry) =>
    selectedWorkHourIds.includes(entry.id)
  );

  const handleWorkHoursSelection = (
    workHourIds: string[],
    totalAmount: number
  ) => {
    setSelectedWorkHourIds(workHourIds);
    setCalculatedAmount(totalAmount);
    setValue("workHourIds", workHourIds);
    setValue("amount", totalAmount);
  };

  const createInvoiceMutation = useCreateInvoice();
  const uploadFileMutation = useUploadInvoiceFile();

  // Sync form invoice number with state
  const watchedInvoiceNumber = watch("invoiceNumber");

  // Update invoice number state when form changes
  useEffect(() => {
    if (watchedInvoiceNumber !== invoiceNumber) {
      setInvoiceNumber(watchedInvoiceNumber || "");
    }
  }, [watchedInvoiceNumber, invoiceNumber]);

  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");

      return;
    }

    setIsUploading(true);
    try {
      // This will be called after invoice creation
      // For now, just store the file for later upload
      console.log("File ready for upload:", selectedFile.name);
      toast.success("File prepared for upload");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to prepare file for upload");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      // Create invoice using the mutation
      const createdInvoice = await createInvoiceMutation.mutateAsync({
        clientId: data.clientId,
        amount: data.amount,
        workHourIds: data.workHourIds,
        description: data.description,
        status: data.status || "PENDING",
      });

      // Upload file if selected
      if (selectedFile && createdInvoice.id) {
        setIsUploading(true);
        try {
          await uploadFileMutation.mutateAsync({
            id: createdInvoice.id,
            file: selectedFile,
          });
          toast.success("Invoice created and file uploaded successfully");
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          toast.warning(
            "Invoice created but file upload failed. You can upload the file later."
          );
        } finally {
          setIsUploading(false);
        }
      } else {
        toast.success("Invoice created successfully");
      }

      reset();
      setSelectedWorkHourIds([]);
      setCalculatedAmount(0);
      setInvoiceNumber("");
      setSelectedFile(null);
      setUploadedFileUrl(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalHours = selectedEntries.reduce(
    (sum: number, entry: TimeEntry) => sum + entry.hours,
    0
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client Selection */}
      <div className="space-y-2">
        <Label htmlFor="clientId">Client</Label>
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <ClientCombobox
              clients={clients || []}
              value={field.value}
              onSelect={field.onChange}
              placeholder="Select a client"
            />
          )}
        />
        {errors.clientId && (
          <p className="text-sm text-red-500">{errors.clientId.message}</p>
        )}
      </div>

      {/* Hourly Rate */}
      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
        <Input
          id="hourlyRate"
          type="number"
          step="0.01"
          min="0"
          placeholder="50.00"
          {...register("hourlyRate", { valueAsNumber: true })}
        />
        {errors.hourlyRate && (
          <p className="text-sm text-red-500">{errors.hourlyRate.message}</p>
        )}
      </div>

      

      {/* Work Hours Selection */}
      <div className="space-y-2">
        <Label>Work Hours</Label>
        {watchedClientId ? (
          <div className="space-y-4">
            {/* Selection Summary (top) */}
            {selectedWorkHourIds.length > 0 && (
              <WorkHoursSelectionSummary
                totalHours={totalHours}
                hourlyRate={watchedHourlyRate || 50}
                totalAmount={calculatedAmount}
              />
            )}
            <WorkHoursSelector
              timeEntries={filteredTimeEntries}
              onSelectionChange={(workHourIds, totalAmount) =>
                handleWorkHoursSelection(workHourIds, totalAmount)
              }
              hourlyRate={watchedHourlyRate || 50}
            />

            {/* Selection Summary */}
            {selectedWorkHourIds.length > 0 && (
              <WorkHoursSelectionSummary
                totalHours={totalHours}
                hourlyRate={watchedHourlyRate || 50}
                totalAmount={calculatedAmount}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Please select a client first to view available work hours</p>
          </div>
        )}
        {errors.workHourIds && (
          <p className="text-sm text-red-500">{errors.workHourIds.message}</p>
        )}
      </div>

      {/* Invoice Amount (Auto-calculated) */}
      <div className="space-y-2">
        <Label htmlFor="amount">Invoice Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          readOnly
          value={calculatedAmount.toFixed(2)}
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Amount is automatically calculated based on selected hours and hourly
          rate
        </p>
        {errors.amount && (
          <p className="text-sm text-red-500">{errors.amount.message}</p>
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

      {/* File Upload */}
      <div className="pt-4">
        <InvoiceFileUpload
          invoiceNumber={invoiceNumber}
          onInvoiceNumberChange={(num) => {
            setInvoiceNumber(num);
            setValue("invoiceNumber", num);
          }}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          isUploading={isUploading}
          onUpload={handleFileUpload}
          existingFileUrl={uploadedFileUrl || undefined}
          uploadButtonText="Prepare File for Upload"
          showInvoiceNumber={true}
          invoiceNumberPlaceholder="Enter invoice number (optional)"
          title="Upload Invoice Document"
          description="Upload the official invoice document after generating it from the tax authority website (optional)"
          compact={false}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={
            isSubmitting || isUploading || selectedWorkHourIds.length === 0
          }
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <FileText className="mr-2 h-4 w-4 animate-pulse" />
              Creating Invoice...
            </>
          ) : isUploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
              Uploading File...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {selectedFile ? "Create Invoice & Upload File" : "Create Invoice"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
