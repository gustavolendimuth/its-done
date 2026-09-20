import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import { CompanyCard } from "./company-card";

import enMessages from "@/messages/en.json";
import ptBRMessages from "@/messages/pt-BR.json";
import { Company } from "@/features/companies/types";

jest.mock("@/features/companies/company-stats", () => ({
  useCompanySpecificStats: () => ({ data: undefined, isLoading: false }),
}));

jest.mock("@/features/companies/companies", () => ({
  useUpdateCompany: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

// CompanyAddresses fetches over the network on mount; not under test here.
jest.mock("./company-addresses", () => ({
  CompanyAddresses: () => null,
}));

const company: Company = {
  id: "c1",
  name: "Ana",
  email: "ana@acme.test",
  phone: "+5511999999999",
  company: "Acme",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("CompanyCard edit modal", () => {
  it.each([
    ["en", enMessages],
    ["pt-BR", ptBRMessages],
  ])(
    "shows the edit subtitle of the clients namespace in %s",
    async (locale, messages) => {
      render(
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CompanyCard company={company} />
        </NextIntlClientProvider>
      );

      await userEvent.click(
        screen.getByRole("button", { name: messages.clients.edit })
      );

      expect(
        await screen.findByText(messages.clients.editClientFormSubtitle)
      ).toBeInTheDocument();
    }
  );
});
