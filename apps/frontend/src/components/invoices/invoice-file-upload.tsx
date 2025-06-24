import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  File,
  Loader2,
} from "lucide-react";

interface InvoiceFileUploadProps {
  /** Número da nota fiscal */
  invoiceNumber: string;
  /** Função chamada quando o número da nota fiscal muda */
  onInvoiceNumberChange: (number: string) => void;
  /** Arquivo selecionado */
  selectedFile: File | null;
  /** Função chamada quando um arquivo é selecionado */
  onFileSelect: (file: File | null) => void;
  /** Estado de carregamento do upload */
  isUploading: boolean;
  /** Função chamada para fazer upload do arquivo */
  onUpload: () => Promise<void>;
  /** URL do arquivo já enviado (opcional) */
  existingFileUrl?: string;
  /** Texto do botão de upload (opcional) */
  uploadButtonText?: string;
  /** Mostrar campo de número da nota fiscal */
  showInvoiceNumber?: boolean;
  /** Placeholder para o número da nota fiscal */
  invoiceNumberPlaceholder?: string;
  /** Título do componente */
  title?: string;
  /** Descrição do componente */
  description?: string;
  /** Tamanho compacto */
  compact?: boolean;
  /** Desabilitar componente */
  disabled?: boolean;
}

export function InvoiceFileUpload({
  invoiceNumber,
  onInvoiceNumberChange,
  selectedFile,
  onFileSelect,
  isUploading,
  onUpload,
  existingFileUrl,
  uploadButtonText = "Upload Document",
  showInvoiceNumber = true,
  invoiceNumberPlaceholder = "Enter invoice number",
  title = "Invoice Document",
  description = "Upload the official invoice document",
  compact = false,
  disabled = false,
}: InvoiceFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;

    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a PDF, image, or Word document");

        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");

        return;
      }

      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf") return FileText;
    if (file.type.startsWith("image/")) return File;

    return FileText;
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");

      return;
    }

    try {
      await onUpload();
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const clearFile = () => {
    onFileSelect(null);
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {showInvoiceNumber && (
          <div className="space-y-2">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              type="text"
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              placeholder={invoiceNumberPlaceholder}
              disabled={disabled}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>File Upload</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="flex-1"
              disabled={disabled}
            />
            {selectedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFile}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedFile.name}</span>
              <span className="ml-2">
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
          )}

          {existingFileUrl && (
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="h-4 w-4 text-green-600" />
              <span>Current file: </span>
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View document
              </a>
            </div>
          )}
        </div>

        <Button
          onClick={handleUploadClick}
          disabled={!selectedFile || isUploading || disabled}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {uploadButtonText}
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {showInvoiceNumber && (
          <div className="space-y-2">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              type="text"
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              placeholder={invoiceNumberPlaceholder}
              disabled={disabled}
            />
          </div>
        )}

        {/* Drag and Drop Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() =>
            !disabled && document.getElementById("file-input")?.click()
          }
        >
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="sr-only"
            disabled={disabled}
          />

          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="font-medium">File Selected</span>
              </div>

              <div className="bg-muted rounded-lg p-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const IconComponent = getFileIcon(selectedFile);

                      return (
                        <IconComponent className="h-8 w-8 text-blue-600" />
                      );
                    })()}
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports PDF, DOC, DOCX, JPG, PNG (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Existing File */}
        {existingFileUrl && (
          <div className="border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-2">
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Current document uploaded
                </p>
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  View uploaded document →
                </a>
              </div>
              <Badge variant="success">Uploaded</Badge>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUploadClick}
          disabled={
            !selectedFile ||
            isUploading ||
            disabled ||
            (showInvoiceNumber && !invoiceNumber.trim())
          }
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {uploadButtonText}
            </>
          )}
        </Button>

        {/* Upload Requirements */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Accepted formats: PDF, DOC, DOCX, JPG, PNG</p>
          <p>• Maximum file size: 10MB</p>
          <p>• Files are securely stored and accessible via direct links</p>
        </div>
      </CardContent>
    </Card>
  );
}
