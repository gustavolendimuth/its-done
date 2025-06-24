import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerComponent } from "@/components/ui/date-picker";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateInvoice, useUploadInvoiceFile } from "@/services/invoices";
import { Upload, FileText, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Client } from "@/services/clients";

const invoiceSchema = z.object({
  number: z.string().min(1, "Invoice number is required"),
  clientId: z.string().min(1, "Client is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.date({
    required_error: "Please select a due date",
  }),
  file: z.any().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceUploadFormProps {
  clients: Client[];
  onSuccess?: () => void;
}

export function InvoiceUploadForm({
  clients,
  onSuccess,
}: InvoiceUploadFormProps) {
  const queryClient = useQueryClient();
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
      dueDate: new Date(),
    },
  });

  const watchedFile = watch("file");

  // Upload file mutation
  const uploadFileMutation = useUploadInvoiceFile();

  // Create invoice mutation
  const createInvoiceMutation = useCreateInvoice();

  const onSubmit = async (data: InvoiceFormData) => {
    setIsUploading(true);
    try {
      let fileUrl = uploadedFileUrl;

      // Upload file if provided and not already uploaded
      if (data.file && data.file.length > 0 && !uploadedFileUrl) {
        const result = await uploadFileMutation.mutateAsync({
          id: data.number,
          file: data.file[0],
        });

        fileUrl = result.fileUrl || null;
      }

      // Create invoice
      await createInvoiceMutation.mutateAsync({
        clientId: data.clientId,
        amount: data.amount,
        workHourIds: [], // Empty array for now
        fileUrl: fileUrl || undefined,
      });

      toast.success("Invoice created successfully");
      reset();
      setUploadedFileUrl(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file upload separately
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      try {
        const result = await uploadFileMutation.mutateAsync({
          id: watch("number"),
          file,
        });

        setUploadedFileUrl(result.fileUrl || null);
        toast.success("File uploaded successfully");
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("Failed to upload file");
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Create Invoice
        </CardTitle>
        <CardDescription>Create an invoice for a client</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="number">Invoice Number</Label>
            <Input
              id="number"
              type="text"
              placeholder="INV-001"
              {...register("number")}
            />
            {errors.number && (
              <p className="text-sm text-red-500">{errors.number.message}</p>
            )}
          </div>

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
                  onClientAdded={() => {
                    // Invalidate clients query to refetch the updated list
                    queryClient.invalidateQueries({ queryKey: ["clients"] });
                  }}
                />
              )}
            />
            {errors.clientId && (
              <p className="text-sm text-red-500">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DatePickerComponent
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select due date"
                  disabled={(date) => date < new Date("1900-01-01")}
                />
              )}
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Invoice File (PDF)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {uploadedFileUrl && (
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Uploaded</span>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isUploading || createInvoiceMutation.isPending}
            className="w-full"
          >
            {isUploading || createInvoiceMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Creating Invoice...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
