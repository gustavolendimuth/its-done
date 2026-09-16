import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { Client } from "@/features/clients/types";

import { EditClientModal } from "./edit-client-modal";

const mockUpdateMutateAsync = jest.fn();

jest.mock("@/features/clients/clients", () => ({
  useUpdateClient: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

// ClientAddresses fetches over the network on mount (useClientAddresses);
// stubbed out here since these tests only exercise the client fields.
jest.mock("./client-addresses", () => ({
  ClientAddresses: () => null,
}));

// Mock das traduções
const messages = {
  clients: {
    editClient: "Edit Client",
    editClientFormSubtitle: "Modify client details and contact information",
    company: "Company",
    name: "Name",
    email: "Email",
    phone: "Phone",
    hourlyRate: "Hourly Rate",
    saveChanges: "Save Changes",
    validationNameRequired: "Name is required",
    validationInvalidEmail: "Invalid email address",
    validationPhoneRequired: "Phone is required",
    validationCompanyRequired: "Company is required",
  },
};

const mockClient: Client = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  company: "Test Company",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
};

describe("EditClientModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render edit client button", () => {
    render(
      <TestWrapper>
        <EditClientModal client={mockClient} />
      </TestWrapper>
    );

    // Verifica se o botão de editar está presente
    expect(screen.getByText("Edit Client")).toBeInTheDocument();
  });

  it("pre-fills the hourlyRate field from the client and submits a decimal value", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({});

    render(
      <TestWrapper>
        <EditClientModal client={{ ...mockClient, hourlyRate: 120.5 }} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText("Edit Client"));

    const hourlyRateInput = screen.getByLabelText("Hourly Rate");
    expect(hourlyRateInput).toHaveValue(120.5);

    fireEvent.change(hourlyRateInput, { target: { value: "99.90" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());
    const payload = mockUpdateMutateAsync.mock.calls[0][0].data;
    expect(payload.hourlyRate).toBe(99.9);
  });

  it("rejects a negative hourlyRate", async () => {
    render(
      <TestWrapper>
        <EditClientModal client={mockClient} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText("Edit Client"));

    fireEvent.change(screen.getByLabelText("Hourly Rate"), {
      target: { value: "-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(
        screen.getByText("Hourly rate must be 0 or greater")
      ).toBeInTheDocument();
    });
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it("submits with hourlyRate left empty (optional)", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({});

    render(
      <TestWrapper>
        <EditClientModal client={mockClient} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText("Edit Client"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());
    const payload = mockUpdateMutateAsync.mock.calls[0][0].data;
    expect(payload.hourlyRate).toBeUndefined();
  });
});
