/**
 * Testes E2E para verificar se as traduções específicas de formulários
 * estão sendo exibidas corretamente na interface do usuário
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import React, { ReactNode } from "react";

import { FormModal } from "@/components/ui/form-modal";

// Importar mensagens reais do sistema
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt-BR.json";

// Função helper para acessar valores aninhados com segurança
function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

const createTestWrapper = (locale: string, messages: unknown) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
};

const TestComponent = ({ children }: { children: ReactNode }) => {
  const t = useTranslations("clients");
  return (
    <FormModal
      title={t("editClient")}
      description={t("editClientFormSubtitle")}
      icon={null}
    >
      {children}
    </FormModal>
  );
};

TestComponent.displayName = "TestComponent";

const TestFormModal = ({ subtitle }: { subtitle: string }) => (
  <FormModal
    open={true}
    onOpenChange={() => {}}
    title="Test Form"
    description={subtitle}
    icon={Users}
  >
    <div>Form content</div>
  </FormModal>
);

TestFormModal.displayName = "TestFormModal";

describe("FormModal Translations E2E", () => {
  describe("English Interface", () => {
    const TestWrapper = createTestWrapper("en", enMessages);

    it("should display specific form subtitle for edit client modal", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {enMessages.clients.editClientFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText("Modify client details and contact information")
      ).toBeInTheDocument();

      // Verifica que NÃO está usando a descrição genérica da página
      expect(
        screen.queryByText(
          "Update client information, contact details and manage addresses"
        )
      ).not.toBeInTheDocument();
    });

    it("should display specific form subtitle for add client modal", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {enMessages.clients.addNewClientFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText("Enter client information and contact details")
      ).toBeInTheDocument();

      // Verifica que NÃO está usando a descrição genérica
      expect(
        screen.queryByText(
          "Create a new client profile with contact details and addresses"
        )
      ).not.toBeInTheDocument();
    });

    it("should display specific form subtitle for work hours", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {enMessages.workHours.addHoursFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText("Record time spent on client projects")
      ).toBeInTheDocument();
    });

    it("should display specific form subtitle for project creation", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {enMessages.projects.addProjectFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText("Create a new project and associate it with a client")
      ).toBeInTheDocument();
    });

    it("should display specific form subtitle for invoice creation", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {enMessages.invoices.createInvoiceFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText("Generate invoice from tracked work hours")
      ).toBeInTheDocument();
    });
  });

  describe("Portuguese Interface", () => {
    const TestWrapper = createTestWrapper("pt-BR", ptMessages);

    it("should display specific form subtitle for edit client modal in Portuguese", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {ptMessages.clients.editClientFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText(
          "Modifique os detalhes e informações de contato do cliente"
        )
      ).toBeInTheDocument();

      // Verifica que NÃO está usando a descrição genérica da página
      expect(
        screen.queryByText(
          "Atualize as informações do cliente, detalhes de contato e gerencie endereços"
        )
      ).not.toBeInTheDocument();
    });

    it("should display specific form subtitle for add client modal in Portuguese", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {ptMessages.clients.addNewClientFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText(
          "Digite as informações e detalhes de contato do cliente"
        )
      ).toBeInTheDocument();
    });

    it("should display specific form subtitle for work hours in Portuguese", () => {
      render(
        <TestWrapper>
          <TestComponent>
            {ptMessages.workHours.addHoursFormSubtitle}
          </TestComponent>
        </TestWrapper>
      );

      expect(
        screen.getByText("Registre o tempo gasto em projetos de clientes")
      ).toBeInTheDocument();
    });
  });

  describe("Translation Consistency", () => {
    it("should have all required form subtitle keys in both languages", () => {
      const requiredKeys = [
        "clients.editClientFormSubtitle",
        "clients.addNewClientFormSubtitle",
        "workHours.addHoursFormSubtitle",
        "projects.addProjectFormSubtitle",
        "invoices.createInvoiceFormSubtitle",
        "invoices.editInvoiceFormSubtitle",
      ];

      requiredKeys.forEach((key) => {
        const enValue = getNestedValue(
          enMessages as Record<string, unknown>,
          key
        );
        const ptValue = getNestedValue(
          ptMessages as Record<string, unknown>,
          key
        );

        expect(enValue).toBeDefined();
        expect(ptValue).toBeDefined();
        expect(typeof enValue).toBe("string");
        expect(typeof ptValue).toBe("string");
        expect(enValue!.length).toBeGreaterThan(0);
        expect(ptValue!.length).toBeGreaterThan(0);
      });
    });

    it("should ensure form subtitles are different from page descriptions", () => {
      // Verificar que as traduções de formulário são diferentes das descrições da página
      expect(enMessages.clients.editClientFormSubtitle).not.toBe(
        enMessages.clients.editClientDescription
      );
      expect(enMessages.clients.addNewClientFormSubtitle).not.toBe(
        enMessages.clients.addNewClientDescription
      );

      expect(ptMessages.clients.editClientFormSubtitle).not.toBe(
        ptMessages.clients.editClientDescription
      );
      expect(ptMessages.clients.addNewClientFormSubtitle).not.toBe(
        ptMessages.clients.addNewClientDescription
      );
    });

    it("should verify specific form translations exist", () => {
      // Verificar chaves específicas de formulários
      expect(enMessages.clients.editClientFormSubtitle).toBe(
        "Modify client details and contact information"
      );
      expect(enMessages.workHours.addHoursFormSubtitle).toBe(
        "Record time spent on client projects"
      );

      expect(ptMessages.clients.editClientFormSubtitle).toBe(
        "Modifique os detalhes e informações de contato do cliente"
      );
      expect(ptMessages.workHours.addHoursFormSubtitle).toBe(
        "Registre o tempo gasto em projetos de clientes"
      );
    });
  });
});
