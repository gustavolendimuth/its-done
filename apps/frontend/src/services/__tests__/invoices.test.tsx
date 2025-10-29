import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { ReactNode } from "react";

import api from "@/lib/axios";
import {
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useUploadInvoiceFile,
  useClientInvoices,
  useDownloadInvoice,
  invoicesService,
  type Invoice,
  type CreateInvoiceDto,
  type UpdateInvoiceDto,
} from "../invoices";

// Mock axios
jest.mock("@/lib/axios");
const mockedApi = api as jest.Mocked<typeof api>;

// Helper to create a test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Invoice Services", () => {
  const mockInvoice: Invoice = {
    id: "1",
    number: "INV-001",
    clientId: "client-1",
    client: {
      id: "client-1",
      name: "John Doe",
      email: "john@example.com",
      company: "Company A",
    },
    amount: 1000,
    status: "PENDING",
    description: "Test Invoice",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    invoiceWorkHours: [
      {
        id: "iwh-1",
        workHour: {
          id: "wh-1",
          date: "2024-03-01T00:00:00Z",
          description: "Work done",
          hours: 10,
          project: {
            id: "project-1",
            name: "Project A",
          },
        },
      },
    ],
  };

  const mockInvoices: Invoice[] = [mockInvoice];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useInvoices", () => {
    it("fetches invoices successfully", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockInvoices });

      const { result } = renderHook(() => useInvoices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockInvoices);
      expect(mockedApi.get).toHaveBeenCalledWith("/invoices", {
        params: undefined,
      });
    });

    it("fetches invoices with filters", async () => {
      const params = {
        from: "2024-01-01",
        to: "2024-12-31",
        clientId: "client-1",
        status: "PENDING" as Invoice["status"],
      };

      mockedApi.get.mockResolvedValueOnce({ data: mockInvoices });

      const { result } = renderHook(() => useInvoices(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.get).toHaveBeenCalledWith("/invoices", { params });
    });

    it("handles fetch error", async () => {
      mockedApi.get.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useInvoices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useInvoice", () => {
    it("fetches a single invoice", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockInvoice });

      const { result } = renderHook(() => useInvoice("1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockInvoice);
      expect(mockedApi.get).toHaveBeenCalledWith("/invoices/1");
    });

    it("does not fetch when id is empty", () => {
      const { result } = renderHook(() => useInvoice(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  describe("useCreateInvoice", () => {
    it("creates an invoice successfully", async () => {
      const createData: CreateInvoiceDto = {
        clientId: "client-1",
        amount: 1000,
        workHourIds: ["wh-1", "wh-2"],
        description: "Test Invoice",
        status: "PENDING",
      };

      mockedApi.post.mockResolvedValueOnce({ data: mockInvoice });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateInvoice(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync(createData);

      expect(mockedApi.post).toHaveBeenCalledWith("/invoices", createData);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["invoices"] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["clients", "client-1", "invoices"],
      });
    });

    it("handles create error", async () => {
      const createData: CreateInvoiceDto = {
        clientId: "client-1",
        amount: 1000,
        workHourIds: ["wh-1"],
      };

      mockedApi.post.mockRejectedValueOnce(new Error("API Error"));

      const { result } = renderHook(() => useCreateInvoice(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync(createData)).rejects.toThrow(
        "API Error"
      );
    });
  });

  describe("useUpdateInvoice", () => {
    it("updates an invoice successfully", async () => {
      const updateData: UpdateInvoiceDto = {
        status: "PAID",
        amount: 1500,
      };

      const updatedInvoice = { ...mockInvoice, ...updateData };
      mockedApi.patch.mockResolvedValueOnce({ data: updatedInvoice });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateInvoice(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync({ id: "1", data: updateData });

      expect(mockedApi.patch).toHaveBeenCalledWith("/invoices/1", updateData);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["invoices"] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["invoices", "1"],
      });
    });

    it("handles update error", async () => {
      mockedApi.patch.mockRejectedValueOnce(new Error("Update failed"));

      const { result } = renderHook(() => useUpdateInvoice(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ id: "1", data: { status: "PAID" } })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("useDeleteInvoice", () => {
    it("deletes an invoice successfully", async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: mockInvoice });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteInvoice(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync("1");

      expect(mockedApi.delete).toHaveBeenCalledWith("/invoices/1");
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["invoices"] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["timeEntries"],
      });
    });

    it("handles delete error", async () => {
      mockedApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const { result } = renderHook(() => useDeleteInvoice(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync("1")).rejects.toThrow(
        "Delete failed"
      );
    });
  });

  describe("useUploadInvoiceFile", () => {
    it("uploads a file successfully", async () => {
      const file = new File(["content"], "invoice.pdf", {
        type: "application/pdf",
      });

      mockedApi.post.mockResolvedValueOnce({ data: mockInvoice });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUploadInvoiceFile(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync({ id: "1", file });

      expect(mockedApi.post).toHaveBeenCalledWith(
        "/invoices/1/upload",
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["invoices"] });
    });

    it("handles upload error", async () => {
      const file = new File(["content"], "invoice.pdf", {
        type: "application/pdf",
      });

      mockedApi.post.mockRejectedValueOnce(new Error("Upload failed"));

      const { result } = renderHook(() => useUploadInvoiceFile(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ id: "1", file })
      ).rejects.toThrow("Upload failed");
    });
  });

  describe("useClientInvoices", () => {
    it("fetches client invoices", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockInvoices });

      const { result } = renderHook(() => useClientInvoices("client-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockInvoices);
      expect(mockedApi.get).toHaveBeenCalledWith("/clients/client-1/invoices");
    });

    it("does not fetch when clientId is empty", () => {
      const { result } = renderHook(() => useClientInvoices(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  describe("useDownloadInvoice", () => {
    it("downloads an invoice file", async () => {
      const blob = new Blob(["pdf content"], { type: "application/pdf" });
      mockedApi.get.mockResolvedValueOnce({ data: blob });

      // Mock DOM methods
      const createObjectURL = jest.fn(() => "blob:url");
      const revokeObjectURL = jest.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const mockLink = {
        href: "",
        setAttribute: jest.fn(),
        click: jest.fn(),
      };
      const createElement = jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink as any);
      const appendChild = jest.spyOn(document.body, "appendChild");
      const removeChild = jest.spyOn(document.body, "removeChild");

      const { result } = renderHook(() => useDownloadInvoice(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync("/files/invoice.pdf");

      expect(mockedApi.get).toHaveBeenCalledWith("/files/invoice.pdf", {
        responseType: "blob",
        headers: {
          "Content-Type": "application/pdf",
        },
      });
      expect(createObjectURL).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();

      // Cleanup
      createElement.mockRestore();
      appendChild.mockRestore();
      removeChild.mockRestore();
    });

    it("handles download error", async () => {
      mockedApi.get.mockRejectedValueOnce(new Error("Download failed"));

      const { result } = renderHook(() => useDownloadInvoice(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync("/files/invoice.pdf")
      ).rejects.toThrow("Download failed");
    });
  });

  describe("invoicesService", () => {
    it("finds invoices by client", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: mockInvoices });

      const result = await invoicesService.findByClient("client-1");

      expect(result).toEqual(mockInvoices);
      expect(mockedApi.get).toHaveBeenCalledWith(
        "/public/client/client-1/invoices"
      );
    });

    it("handles error when finding by client", async () => {
      mockedApi.get.mockRejectedValueOnce(new Error("Not found"));

      await expect(
        invoicesService.findByClient("client-1")
      ).rejects.toThrow("Not found");
    });
  });

  describe("Edge Cases", () => {
    it("handles invoice with no work hours", async () => {
      const invoiceNoHours = { ...mockInvoice, invoiceWorkHours: [] };
      mockedApi.get.mockResolvedValueOnce({ data: [invoiceNoHours] });

      const { result } = renderHook(() => useInvoices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].invoiceWorkHours).toEqual([]);
    });

    it("handles invoice with different status formats", async () => {
      const invoiceLowercase = { ...mockInvoice, status: "pending" as const };
      mockedApi.get.mockResolvedValueOnce({ data: [invoiceLowercase] });

      const { result } = renderHook(() => useInvoices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].status).toBe("pending");
    });

    it("handles invoice without optional fields", async () => {
      const minimalInvoice: Invoice = {
        id: "2",
        clientId: "client-2",
        amount: 500,
        status: "PENDING",
        createdAt: "2024-03-01T00:00:00Z",
        updatedAt: "2024-03-01T00:00:00Z",
      };

      mockedApi.get.mockResolvedValueOnce({ data: [minimalInvoice] });

      const { result } = renderHook(() => useInvoices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0]).toEqual(minimalInvoice);
    });

    it("handles update with partial data", async () => {
      const partialUpdate: UpdateInvoiceDto = {
        status: "CANCELED",
      };

      mockedApi.patch.mockResolvedValueOnce({
        data: { ...mockInvoice, status: "CANCELED" },
      });

      const { result } = renderHook(() => useUpdateInvoice(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: "1", data: partialUpdate });

      expect(mockedApi.patch).toHaveBeenCalledWith("/invoices/1", partialUpdate);
    });
  });

  describe("Cache Invalidation", () => {
    it("invalidates all related queries on create", async () => {
      mockedApi.post.mockResolvedValueOnce({ data: mockInvoice });

      const queryClient = createTestQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateInvoice(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync({
        clientId: "client-1",
        amount: 1000,
        workHourIds: ["wh-1"],
      });

      // Check all expected invalidations
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["invoices"] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["clients", "client-1", "invoices"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["timeEntries"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["invoices", "stats"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["clients", "stats"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["dashboard"],
      });
    });
  });
});
