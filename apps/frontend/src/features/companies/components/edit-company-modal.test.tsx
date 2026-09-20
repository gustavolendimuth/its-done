import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { Company } from "@/features/companies/types";

import { EditCompanyModal } from "./edit-company-modal";

const mockUpdateMutateAsync = jest.fn();

jest.mock("@/features/companies/companies", () => ({
  useUpdateCompany: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

// CompanyAddresses fetches over the network on mount (useCompanyAddresses);
// stubbed out here since these tests only exercise the client fields.
jest.mock("./company-addresses", () => ({
  CompanyAddresses: () => null,
}));

// Mock translations
const messages = {
  clients: {
    editClient: "Edit Company",
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

const mockCompany: Company = {
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

describe("EditCompanyModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render edit client button", () => {
    render(
      <TestWrapper>
        <EditCompanyModal company={mockCompany} />
      </TestWrapper>
    );

    // Check that the edit button is present
    expect(screen.getByText("Edit Company")).toBeInTheDocument();
  });

  it("opens with empty fields and no React warning when name and phone are null", () => {
    // Company.name and Company.phone are nullable columns: the API sends null.
    const apiCompany = {
      ...mockCompany,
      name: null,
      phone: null,
    } as unknown as Company;
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <TestWrapper>
        <EditCompanyModal company={apiCompany} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Edit Company"));

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Phone")).toHaveValue("");
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("pre-fills the hourlyRate field from the client and submits a decimal value", async () => {
    mockUpdateMutateAsync.mockResolvedValueOnce({});

    render(
      <TestWrapper>
        <EditCompanyModal company={{ ...mockCompany, hourlyRate: 120.5 }} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText("Edit Company"));

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
        <EditCompanyModal company={mockCompany} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText("Edit Company"));

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
        <EditCompanyModal company={mockCompany} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText("Edit Company"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());
    const payload = mockUpdateMutateAsync.mock.calls[0][0].data;
    expect(payload.hourlyRate).toBeUndefined();
  });
});
