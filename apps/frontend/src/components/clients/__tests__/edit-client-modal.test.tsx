import { render, screen } from "@testing-library/react";
import { EditClientModal } from "../edit-client-modal";
import { Client } from "@/types/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

// Mock das traduções
const messages = {
  clients: {
    editClient: "Edit Client",
    editClientFormSubtitle: "Modify client details and contact information",
    company: "Company",
    name: "Name",
    email: "Email",
    phone: "Phone",
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
  it("should render edit client button", () => {
    render(
      <TestWrapper>
        <EditClientModal client={mockClient} />
      </TestWrapper>
    );

    // Verifica se o botão de editar está presente
    expect(screen.getByText("Edit Client")).toBeInTheDocument();
  });
});
