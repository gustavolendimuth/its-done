import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminActivatePage from "./page";

const pushMock = jest.fn();
const signInMock = jest.fn();
const mutateAsyncMock = jest.fn();
let tokenParam: string | null = "activation-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? tokenParam : null),
  }),
}));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

jest.mock("@/features/company-admin", () => ({
  useConfirmCompanyActivation: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

async function fillAndSubmit(password: string, confirmation = password) {
  await userEvent.type(screen.getByLabelText("Senha"), password);
  await userEvent.type(screen.getByLabelText("Confirmar senha"), confirmation);
  await userEvent.click(screen.getByRole("button", { name: "Ativar conta" }));
}

describe("CompanyAdminActivatePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenParam = "activation-token";
  });

  it("confirms with the token, signs in with the returned email and goes to the dashboard", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      admin: { id: "a1", email: "admin@acme.com", companyId: "c1" },
    });
    signInMock.mockResolvedValueOnce({ ok: true });

    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret");

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      token: "activation-token",
      password: "supersecret",
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "admin@acme.com",
      password: "supersecret",
      redirect: false,
    });
    expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard");
  });

  it("shows an error and no form when the token is missing", () => {
    tokenParam = null;

    render(<CompanyAdminActivatePage />);

    expect(
      screen.getByText("Link de ativação inválido ou incompleto.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("blocks the submit when the passwords differ", async () => {
    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret", "different1");

    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows the backend message and a login link when the company was already activated", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          message: "Company is already activated; use the Admin invite flow instead",
        },
      },
    });

    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText(
        "Company is already activated; use the Admin invite flow instead"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para o login" })
    ).toHaveAttribute("href", "/login");
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("explains that the account exists when the automatic sign-in fails", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      admin: { id: "a1", email: "admin@acme.com", companyId: "c1" },
    });
    signInMock.mockResolvedValueOnce({ ok: false });

    render(<CompanyAdminActivatePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText(
        "Conta ativada, mas não foi possível entrar automaticamente. Entre pelo login."
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
