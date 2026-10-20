import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";

import "@testing-library/jest-dom";
import CompanyAdminDomainConfirmPage from "./page";

const mutateAsyncMock = jest.fn();
let tokenParam: string | null;

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? tokenParam : null),
  }),
}));

// No next-auth mock on purpose: the page must render without a session provider.
jest.mock("@/features/company-admin", () => ({
  useConfirmCompanyDomain: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
  })),
}));

function backendError(message: string | string[]) {
  return { response: { data: { message } } };
}

describe("CompanyAdminDomainConfirmPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenParam = "domain-token";
  });

  it("confirms the domain from the token and shows its name", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      id: "d1",
      domain: "acme.com",
      status: "CONFIRMED",
    });

    render(<CompanyAdminDomainConfirmPage />);

    expect(await screen.findByText("Domínio confirmado")).toBeInTheDocument();
    expect(
      screen.getByText("O domínio acme.com agora está confirmado.")
    ).toBeInTheDocument();
    expect(mutateAsyncMock).toHaveBeenCalledWith({ token: "domain-token" });
  });

  it("sends the confirmation once under StrictMode", async () => {
    mutateAsyncMock.mockResolvedValue({ id: "d1", domain: "acme.com" });

    render(
      <StrictMode>
        <CompanyAdminDomainConfirmPage />
      </StrictMode>
    );

    await screen.findByText("Domínio confirmado");
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state while the request is pending", () => {
    mutateAsyncMock.mockReturnValueOnce(new Promise(() => {}));

    render(<CompanyAdminDomainConfirmPage />);

    expect(screen.getByText("Confirmando domínio…")).toBeInTheDocument();
    expect(screen.queryByText("Domínio confirmado")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Não foi possível confirmar o domínio")
    ).not.toBeInTheDocument();
  });

  it.each([
    "Invalid or expired confirmation token",
    "Authorized domain is not pending confirmation",
    "Authorized domain not found",
  ])("shows the backend message: %s", async (message) => {
    mutateAsyncMock.mockRejectedValueOnce(backendError(message));

    render(<CompanyAdminDomainConfirmPage />);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText("Domínio confirmado")).not.toBeInTheDocument();
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("shows an error and sends no request when the token is missing", () => {
    tokenParam = null;

    render(<CompanyAdminDomainConfirmPage />);

    expect(
      screen.getByText("Link de confirmação inválido ou incompleto.")
    ).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("links to the dashboard from the success and error states", async () => {
    mutateAsyncMock.mockResolvedValueOnce({ id: "d1", domain: "acme.com" });
    const { unmount } = render(<CompanyAdminDomainConfirmPage />);
    await screen.findByText("Domínio confirmado");
    expect(
      screen.getByRole("link", { name: "Ir para o painel" })
    ).toHaveAttribute("href", "/company-admin/dashboard");
    unmount();

    mutateAsyncMock.mockRejectedValueOnce(
      backendError("Authorized domain not found")
    );
    render(<CompanyAdminDomainConfirmPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Authorized domain not found")
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole("link", { name: "Ir para o painel" })
    ).toHaveAttribute("href", "/company-admin/dashboard");
  });
});
