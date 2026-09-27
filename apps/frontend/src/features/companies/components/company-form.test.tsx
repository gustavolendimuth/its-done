import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import { CompanyForm } from "./company-form";

import enMessages from "@/messages/en.json";

const mockCreateMutateAsync = jest.fn();

jest.mock("@/features/companies/companies", () => ({
  useCreateCompany: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
    isError: false,
  }),
}));

jest.mock("@/features/companies/addresses", () => ({
  useCompanyAddresses: () => ({ data: undefined }),
}));

function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <CompanyForm />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

async function fillAndSubmit(company: string) {
  await userEvent.type(screen.getByLabelText(/^Company/), company);
  await userEvent.type(screen.getByLabelText(/^Email/), "ana@acme.test");
  await userEvent.click(screen.getByRole("button", { name: /^Create/ }));
}

describe("CompanyForm company name", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows a visible error and does not submit when the name is only whitespace", async () => {
    renderForm();

    await fillAndSubmit("   ");

    expect(
      await screen.findByText(enMessages.clients.validationCompanyRequired)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Company/)).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it("clears the error once the name is corrected", async () => {
    renderForm();
    await fillAndSubmit("   ");
    await screen.findByText(enMessages.clients.validationCompanyRequired);

    await userEvent.type(screen.getByLabelText(/^Company/), "Acme");

    expect(
      screen.queryByText(enMessages.clients.validationCompanyRequired)
    ).not.toBeInTheDocument();
  });

  it("sends the company name without surrounding whitespace", async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ id: "c1" });
    renderForm();

    await fillAndSubmit("  Acme Corp  ");

    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ company: "Acme Corp" })
    );
  });
});
