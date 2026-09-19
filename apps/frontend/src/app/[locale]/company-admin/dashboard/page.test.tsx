import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminDashboardPage from "./page";

const mutateAsyncMock = jest.fn().mockResolvedValue(undefined);
const mutateMock = jest.fn();
const deactivateMutateAsyncMock = jest.fn().mockResolvedValue(undefined);
const logoutMock = jest.fn();

jest.mock("@/features/company-admin", () => ({
  useCompanyDashboardOverview: jest.fn(),
  useCompanyDashboardCollaborators: jest.fn(),
  useCompanyInvites: jest.fn(),
  useCompanyDomains: jest.fn(),
  useCreateCompanyInvite: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
  useRevokeCompanyInvite: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useCreateCompanyDomain: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
  useRevokeCompanyDomain: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useRequestCompanyDomainConfirmation: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useDeactivateCompany: jest.fn(() => ({
    mutateAsync: deactivateMutateAsyncMock,
    isPending: false,
  })),
  useCompanyAdminAuth: jest.fn(() => ({
    logout: logoutMock,
  })),
  downloadCompanyDashboardExport: jest.fn(),
}));

import {
  useCompanyDashboardCollaborators,
  useCompanyDashboardOverview,
  useCompanyDomains,
  useCompanyInvites,
} from "@/features/company-admin";

const mockOverview = {
  collaboratorsAtivos: 4,
  horasPeriodo: 32.5,
  totalFaturado: 1234.5,
  pendingInvites: 2,
  from: "2026-09-01T00:00:00.000Z",
  to: "2026-09-30T23:59:59.999Z",
};

const mockCollaborators = [
  {
    id: "c1",
    userId: "u1",
    name: "Ana Souza",
    email: "ana@test.local",
    origin: "INVITE" as const,
    horas: 10,
    projetos: 2,
    faturado: 500,
  },
  {
    id: "c2",
    userId: "u2",
    name: "Bruno Lima",
    email: "bruno@test.local",
    origin: "DOMAIN" as const,
    horas: 22.5,
    projetos: 1,
    faturado: 734.5,
  },
];

const mockInvites = [
  {
    id: "i1",
    companyId: "e1",
    email: "pendente@test.local",
    status: "PENDING" as const,
    linkedAt: null,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "i2",
    companyId: "e1",
    email: "outro-pendente@test.local",
    status: "PENDING" as const,
    linkedAt: null,
    createdAt: "2026-09-02T00:00:00.000Z",
  },
];

const mockDomains = [
  {
    id: "d1",
    companyId: "e1",
    domain: "acme.com",
    status: "CONFIRMED" as const,
    confirmedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
];

function mockHooks() {
  (useCompanyDashboardOverview as jest.Mock).mockReturnValue({
    data: mockOverview,
    isLoading: false,
  });
  (useCompanyDashboardCollaborators as jest.Mock).mockReturnValue({
    data: mockCollaborators,
    isLoading: false,
  });
  (useCompanyInvites as jest.Mock).mockReturnValue({
    data: mockInvites,
    isLoading: false,
  });
  (useCompanyDomains as jest.Mock).mockReturnValue({
    data: mockDomains,
    isLoading: false,
  });
}

describe("CompanyAdminDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHooks();
  });

  it("renders the overview cards with the aggregated stats", () => {
    render(<CompanyAdminDashboardPage />);

    expect(screen.getByText("Collaborators ativos")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.getByText("Horas no período")).toBeInTheDocument();
    expect(screen.getByText("32.5h")).toBeInTheDocument();

    expect(screen.getByText("Total faturado")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.234,50")).toBeInTheDocument();

    expect(screen.getByText("Convites pendentes")).toBeInTheDocument();
    // "2" appears both as the overview card value and the Vínculos tab badge
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Collaborators table with name/email, vínculo, horas, projetos and faturado", async () => {
    render(<CompanyAdminDashboardPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Collaborators" }));

    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText("ana@test.local")).toBeInTheDocument();
    expect(screen.getByText("Convite")).toBeInTheDocument();
    expect(screen.getByText("10.0h")).toBeInTheDocument();
    expect(screen.getByText("R$ 500,00")).toBeInTheDocument();

    expect(screen.getByText("Bruno Lima")).toBeInTheDocument();
    expect(screen.getByText("Domínio")).toBeInTheDocument();
    expect(screen.getByText("22.5h")).toBeInTheDocument();
    expect(screen.getByText("R$ 734,50")).toBeInTheDocument();
  });

  it("shows the pending invites counter as a badge on the Vínculos tab", () => {
    render(<CompanyAdminDashboardPage />);

    const tab = screen.getByRole("tab", { name: /Vínculos/ });
    expect(tab).toHaveTextContent("2");
  });

  it("shows the empty state when there are no Collaborators", async () => {
    (useCompanyDashboardCollaborators as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<CompanyAdminDashboardPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Collaborators" }));

    expect(
      screen.getByText("Nenhum Collaborator vinculado ainda.")
    ).toBeInTheDocument();
  });

  it("renders the export button in the header, outside the tabs", () => {
    render(<CompanyAdminDashboardPage />);

    expect(
      screen.getByRole("button", { name: /Exportar período/ })
    ).toBeInTheDocument();
  });

  it("Vínculos tab lists Convites Pendentes and Domínios Autorizados, with a revoke action for each", async () => {
    render(<CompanyAdminDashboardPage />);
    await userEvent.click(screen.getByRole("tab", { name: /Vínculos/ }));

    expect(screen.getByText("pendente@test.local")).toBeInTheDocument();
    expect(screen.getByText("outro-pendente@test.local")).toBeInTheDocument();
    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getByText("Confirmado")).toBeInTheDocument();

    expect(
      screen.getByLabelText("Revogar convite de pendente@test.local")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Revogar domínio acme.com")
    ).toBeInTheDocument();
  });

  it("creates a new Convite Pendente from the Vínculos tab form", async () => {
    render(<CompanyAdminDashboardPage />);
    await userEvent.click(screen.getByRole("tab", { name: /Vínculos/ }));

    await userEvent.type(
      screen.getByPlaceholderText("email@collaborator.com"),
      "novo@test.local"
    );
    await userEvent.click(screen.getByRole("button", { name: /Convidar/ }));

    expect(mutateAsyncMock).toHaveBeenCalledWith("novo@test.local");
  });

  it("renders the Desativar Empresa button in the header, outside the tabs", () => {
    render(<CompanyAdminDashboardPage />);

    expect(
      screen.getByRole("button", { name: /Desativar Empresa/ })
    ).toBeInTheDocument();
  });

  it("desativação exige confirmação: abrir o botão não desativa nada até confirmar no diálogo", async () => {
    render(<CompanyAdminDashboardPage />);

    await userEvent.click(
      screen.getByRole("button", { name: /Desativar Empresa/ })
    );
    expect(deactivateMutateAsyncMock).not.toHaveBeenCalled();

    // Radix hides everything outside the dialog from the accessibility
    // tree while it's open (including the header trigger), so only the
    // dialog's own confirm button matches here. The click goes through
    // fireEvent (a raw DOM event) instead of userEvent's pointer-events-
    // aware simulation, since Radix also marks the background inert.
    const confirmButton = screen.getByRole("button", {
      name: /Desativar Empresa/,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(logoutMock).toHaveBeenCalled());
    expect(deactivateMutateAsyncMock).toHaveBeenCalled();
  });

  it("cancelar o diálogo de desativação não chama a mutação", async () => {
    render(<CompanyAdminDashboardPage />);

    await userEvent.click(
      screen.getByRole("button", { name: /Desativar Empresa/ })
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(deactivateMutateAsyncMock).not.toHaveBeenCalled();
  });
});
