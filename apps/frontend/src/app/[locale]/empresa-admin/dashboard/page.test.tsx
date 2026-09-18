import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import EmpresaAdminDashboardPage from "./page";

const mutateAsyncMock = jest.fn().mockResolvedValue(undefined);
const mutateMock = jest.fn();
const deactivateMutateAsyncMock = jest.fn().mockResolvedValue(undefined);
const logoutMock = jest.fn();

jest.mock("@/features/empresa-admin", () => ({
  useEmpresaDashboardOverview: jest.fn(),
  useEmpresaDashboardColaboradores: jest.fn(),
  useEmpresaInvites: jest.fn(),
  useEmpresaDomains: jest.fn(),
  useCreateEmpresaInvite: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
  useRevokeEmpresaInvite: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useCreateEmpresaDomain: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
  useRevokeEmpresaDomain: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useRequestEmpresaDomainConfirmation: jest.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
  useDeactivateEmpresa: jest.fn(() => ({
    mutateAsync: deactivateMutateAsyncMock,
    isPending: false,
  })),
  useEmpresaAdminAuth: jest.fn(() => ({
    logout: logoutMock,
  })),
  downloadEmpresaDashboardExport: jest.fn(),
}));

import {
  useEmpresaDashboardColaboradores,
  useEmpresaDashboardOverview,
  useEmpresaDomains,
  useEmpresaInvites,
} from "@/features/empresa-admin";

const mockOverview = {
  colaboradoresAtivos: 4,
  horasPeriodo: 32.5,
  totalFaturado: 1234.5,
  convitesPendentes: 2,
  from: "2026-09-01T00:00:00.000Z",
  to: "2026-09-30T23:59:59.999Z",
};

const mockColaboradores = [
  {
    id: "c1",
    userId: "u1",
    name: "Ana Souza",
    email: "ana@test.local",
    origin: "CONVITE" as const,
    horas: 10,
    projetos: 2,
    faturado: 500,
  },
  {
    id: "c2",
    userId: "u2",
    name: "Bruno Lima",
    email: "bruno@test.local",
    origin: "DOMINIO" as const,
    horas: 22.5,
    projetos: 1,
    faturado: 734.5,
  },
];

const mockInvites = [
  {
    id: "i1",
    empresaId: "e1",
    email: "pendente@test.local",
    status: "PENDING" as const,
    linkedAt: null,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "i2",
    empresaId: "e1",
    email: "outro-pendente@test.local",
    status: "PENDING" as const,
    linkedAt: null,
    createdAt: "2026-09-02T00:00:00.000Z",
  },
];

const mockDomains = [
  {
    id: "d1",
    empresaId: "e1",
    domain: "acme.com",
    status: "CONFIRMED" as const,
    confirmedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
];

function mockHooks() {
  (useEmpresaDashboardOverview as jest.Mock).mockReturnValue({
    data: mockOverview,
    isLoading: false,
  });
  (useEmpresaDashboardColaboradores as jest.Mock).mockReturnValue({
    data: mockColaboradores,
    isLoading: false,
  });
  (useEmpresaInvites as jest.Mock).mockReturnValue({
    data: mockInvites,
    isLoading: false,
  });
  (useEmpresaDomains as jest.Mock).mockReturnValue({
    data: mockDomains,
    isLoading: false,
  });
}

describe("EmpresaAdminDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHooks();
  });

  it("renders the overview cards with the aggregated stats", () => {
    render(<EmpresaAdminDashboardPage />);

    expect(screen.getByText("Colaboradores ativos")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.getByText("Horas no período")).toBeInTheDocument();
    expect(screen.getByText("32.5h")).toBeInTheDocument();

    expect(screen.getByText("Total faturado")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.234,50")).toBeInTheDocument();

    expect(screen.getByText("Convites pendentes")).toBeInTheDocument();
    // "2" appears both as the overview card value and the Vínculos tab badge
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Colaboradores table with name/email, vínculo, horas, projetos and faturado", async () => {
    render(<EmpresaAdminDashboardPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Colaboradores" }));

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
    render(<EmpresaAdminDashboardPage />);

    const tab = screen.getByRole("tab", { name: /Vínculos/ });
    expect(tab).toHaveTextContent("2");
  });

  it("shows the empty state when there are no Colaboradores", async () => {
    (useEmpresaDashboardColaboradores as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<EmpresaAdminDashboardPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Colaboradores" }));

    expect(
      screen.getByText("Nenhum Colaborador vinculado ainda.")
    ).toBeInTheDocument();
  });

  it("renders the export button in the header, outside the tabs", () => {
    render(<EmpresaAdminDashboardPage />);

    expect(
      screen.getByRole("button", { name: /Exportar período/ })
    ).toBeInTheDocument();
  });

  it("Vínculos tab lists Convites Pendentes and Domínios Autorizados, with a revoke action for each", async () => {
    render(<EmpresaAdminDashboardPage />);
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
    render(<EmpresaAdminDashboardPage />);
    await userEvent.click(screen.getByRole("tab", { name: /Vínculos/ }));

    await userEvent.type(
      screen.getByPlaceholderText("email@colaborador.com"),
      "novo@test.local"
    );
    await userEvent.click(screen.getByRole("button", { name: /Convidar/ }));

    expect(mutateAsyncMock).toHaveBeenCalledWith("novo@test.local");
  });

  it("renders the Desativar Empresa button in the header, outside the tabs", () => {
    render(<EmpresaAdminDashboardPage />);

    expect(
      screen.getByRole("button", { name: /Desativar Empresa/ })
    ).toBeInTheDocument();
  });

  it("desativação exige confirmação: abrir o botão não desativa nada até confirmar no diálogo", async () => {
    render(<EmpresaAdminDashboardPage />);

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
    render(<EmpresaAdminDashboardPage />);

    await userEvent.click(
      screen.getByRole("button", { name: /Desativar Empresa/ })
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(deactivateMutateAsyncMock).not.toHaveBeenCalled();
  });
});
