import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

// Importar os arquivos de tradução reais
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt-BR.json";

const TestComponent = ({ locale }: { locale: string }) => {
  const messages = locale === "en" ? enMessages : ptMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div>
        {/* Simular traduções de formulários */}
        <div data-testid="edit-client-form-subtitle">
          {messages.clients.editClientFormSubtitle}
        </div>
        <div data-testid="add-client-form-subtitle">
          {messages.clients.addNewClientFormSubtitle}
        </div>
        <div data-testid="add-hours-form-subtitle">
          {messages.workHours.addHoursFormSubtitle}
        </div>
        <div data-testid="add-project-form-subtitle">
          {messages.projects.addProjectFormSubtitle}
        </div>
        <div data-testid="create-invoice-form-subtitle">
          {messages.invoices.createInvoiceFormSubtitle}
        </div>
      </div>
    </NextIntlClientProvider>
  );
};

describe("Form Translations", () => {
  describe("English translations", () => {
    it("should have all form subtitles in English", () => {
      render(<TestComponent locale="en" />);

      expect(screen.getByTestId("edit-client-form-subtitle")).toHaveTextContent(
        "Modify client details and contact information"
      );
      expect(screen.getByTestId("add-client-form-subtitle")).toHaveTextContent(
        "Enter client information and contact details"
      );
      expect(screen.getByTestId("add-hours-form-subtitle")).toHaveTextContent(
        "Record time spent on client projects"
      );
      expect(screen.getByTestId("add-project-form-subtitle")).toHaveTextContent(
        "Create a new project and associate it with a client"
      );
      expect(
        screen.getByTestId("create-invoice-form-subtitle")
      ).toHaveTextContent("Generate invoice from tracked work hours");
    });
  });

  describe("Portuguese translations", () => {
    it("should have all form subtitles in Portuguese", () => {
      render(<TestComponent locale="pt-BR" />);

      expect(screen.getByTestId("edit-client-form-subtitle")).toHaveTextContent(
        "Modifique os detalhes e informações de contato do cliente"
      );
      expect(screen.getByTestId("add-client-form-subtitle")).toHaveTextContent(
        "Digite as informações e detalhes de contato do cliente"
      );
      expect(screen.getByTestId("add-hours-form-subtitle")).toHaveTextContent(
        "Registre o tempo gasto em projetos de clientes"
      );
      expect(screen.getByTestId("add-project-form-subtitle")).toHaveTextContent(
        "Crie um novo projeto e associe-o a um cliente"
      );
      expect(
        screen.getByTestId("create-invoice-form-subtitle")
      ).toHaveTextContent(
        "Gere fatura a partir das horas trabalhadas registradas"
      );
    });
  });

  describe("Translation consistency", () => {
    it("should have specific form subtitles different from page descriptions", () => {
      // Verificar que os subtítulos dos formulários são diferentes das descrições das páginas
      expect(enMessages.clients.editClientFormSubtitle).not.toBe(
        enMessages.clients.editClientDescription
      );
      expect(ptMessages.clients.editClientFormSubtitle).not.toBe(
        ptMessages.clients.editClientDescription
      );

      expect(enMessages.clients.addNewClientFormSubtitle).not.toBe(
        enMessages.clients.addNewClientDescription
      );
      expect(ptMessages.clients.addNewClientFormSubtitle).not.toBe(
        ptMessages.clients.addNewClientDescription
      );

      // Verificar que os subtítulos são mais concisos que as descrições
      expect(enMessages.workHours.addHoursFormSubtitle.length).toBeLessThan(
        enMessages.workHours.description.length
      );
      expect(ptMessages.workHours.addHoursFormSubtitle.length).toBeLessThan(
        ptMessages.workHours.description.length
      );
    });

    it("should have WorkHour card specific translations", () => {
      // Verificar tradução específica do card de horas
      expect(enMessages.workHours.on).toBeDefined();
      expect(ptMessages.workHours.on).toBeDefined();

      // Verificar se as traduções são corretas
      expect(enMessages.workHours.on).toBe("on");
      expect(ptMessages.workHours.on).toBe("em");
    });

    it("should support custom time ago translations", () => {
      // Verificar se as traduções de tempo relativo existem
      expect(enMessages.workHours.timeAgo).toBeDefined();
      expect(ptMessages.workHours.timeAgo).toBeDefined();

      // Verificar traduções específicas
      expect(enMessages.workHours.timeAgo.day).toBe("1 day");
      expect(ptMessages.workHours.timeAgo.day).toBe("1 dia");

      expect(enMessages.workHours.timeAgo.hours).toBe("{count} hours");
      expect(ptMessages.workHours.timeAgo.hours).toBe("{count} horas");

      // Verificar tradução "created"
      expect(enMessages.workHours.created).toBe("Created");
      expect(ptMessages.workHours.created).toBe("Criado");
    });
  });
});
