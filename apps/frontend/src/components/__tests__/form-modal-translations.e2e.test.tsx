/**
 * Testes E2E para verificar se as traduções específicas de formulários
 * estão sendo exibidas corretamente na interface do usuário
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormModal } from "@/components/ui/form-modal";
import { Users } from "lucide-react";

// Importar mensagens reais do sistema
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt-BR.json";

const createTestWrapper = (locale: string, messages: any) => {
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

describe("FormModal Translations E2E", () => {
  describe("English Interface", () => {
    const TestWrapper = createTestWrapper("en", enMessages);

    it("should display specific form subtitle for edit client modal", () => {
      render(
        <TestWrapper>
          <TestFormModal subtitle={enMessages.clients.editClientFormSubtitle} />
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
          <TestFormModal
            subtitle={enMessages.clients.addNewClientFormSubtitle}
          />
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
          <TestFormModal subtitle={enMessages.workHours.addHoursFormSubtitle} />
        </TestWrapper>
      );

      expect(
        screen.getByText("Record time spent on client projects")
      ).toBeInTheDocument();
    });

    it("should display specific form subtitle for project creation", () => {
      render(
        <TestWrapper>
          <TestFormModal
            subtitle={enMessages.projects.addProjectFormSubtitle}
          />
        </TestWrapper>
      );

      expect(
        screen.getByText("Create a new project and associate it with a client")
      ).toBeInTheDocument();
    });

    it("should display specific form subtitle for invoice creation", () => {
      render(
        <TestWrapper>
          <TestFormModal
            subtitle={enMessages.invoices.createInvoiceFormSubtitle}
          />
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
          <TestFormModal subtitle={ptMessages.clients.editClientFormSubtitle} />
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
          <TestFormModal
            subtitle={ptMessages.clients.addNewClientFormSubtitle}
          />
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
          <TestFormModal subtitle={ptMessages.workHours.addHoursFormSubtitle} />
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
        const keyParts = key.split(".");
        const enValue = keyParts.reduce(
          (obj, part) => obj[part],
          enMessages as any
        );
        const ptValue = keyParts.reduce(
          (obj, part) => obj[part],
          ptMessages as any
        );

        expect(enValue).toBeDefined();
        expect(ptValue).toBeDefined();
        expect(typeof enValue).toBe("string");
        expect(typeof ptValue).toBe("string");
        expect(enValue.length).toBeGreaterThan(0);
        expect(ptValue.length).toBeGreaterThan(0);
      });
    });

    it("should have different texts for form subtitles vs page descriptions", () => {
      // Verifica inglês
      expect(enMessages.clients.editClientFormSubtitle).not.toBe(
        enMessages.clients.editClientDescription
      );
      expect(enMessages.clients.addNewClientFormSubtitle).not.toBe(
        enMessages.clients.addNewClientDescription
      );

      // Verifica português
      expect(ptMessages.clients.editClientFormSubtitle).not.toBe(
        ptMessages.clients.editClientDescription
      );
      expect(ptMessages.clients.addNewClientFormSubtitle).not.toBe(
        ptMessages.clients.addNewClientDescription
      );
    });
  });
});
