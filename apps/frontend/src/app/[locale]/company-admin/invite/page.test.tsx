import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminInvitePage from "./page";

const pushMock = jest.fn();
const signInMock = jest.fn();
const mutateAsyncMock = jest.fn();

function makeToken(exp: number): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "HS256" })}.${encode({ exp })}.signature`;
}

const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;
let tokenParam: string | null;

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
  useConfirmCompanyAdminInvite: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

async function fillAndSubmit(password: string, confirmation = password) {
  await userEvent.type(screen.getByLabelText("Senha"), password);
  await userEvent.type(screen.getByLabelText("Confirmar senha"), confirmation);
  await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
}

describe("CompanyAdminInvitePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenParam = makeToken(inOneHour());
  });

  it("confirms with the token, signs in with the returned email and goes to the dashboard", async () => {
    const token = tokenParam as string;
    mutateAsyncMock.mockResolvedValueOnce({
      admin: { id: "a2", email: "second@acme.com", companyId: "c1" },
    });
    signInMock.mockResolvedValueOnce({ ok: true });

    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret");

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      token,
      password: "supersecret",
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "second@acme.com",
      password: "supersecret",
      redirect: false,
    });
    expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard");
  });

  it("shows an error and no form when the token is missing", () => {
    tokenParam = null;

    render(<CompanyAdminInvitePage />);

    expect(
      screen.getByText("Link de convite inválido ou incompleto.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows an error and no form when the token is malformed", () => {
    tokenParam = "not-a-jwt";

    render(<CompanyAdminInvitePage />);

    expect(
      screen.getByText("Link de convite inválido ou incompleto.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows an error and no form when the token already expired", () => {
    tokenParam = makeToken(Math.floor(Date.now() / 1000) - 60);

    render(<CompanyAdminInvitePage />);

    expect(screen.getByText(/Este convite expirou/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("blocks the submit when the passwords differ", async () => {
    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret", "different1");

    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows a generic message when the request fails without a backend message", async () => {
    mutateAsyncMock.mockRejectedValueOnce(new Error("Network Error"));

    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText(
        "Não foi possível aceitar o convite. Tente novamente."
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("joins the messages when the backend answers a validation error list", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: ["password too short", "token must be a string"] },
      },
    });

    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText("password too short; token must be a string")
    ).toBeInTheDocument();
  });

  it("shows the backend message and does not redirect when the email is already in use", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: "Email already in use by another company admin" },
      },
    });

    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText("Email already in use by another company admin")
    ).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows the backend message when the company no longer exists", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: { status: 404, data: { message: "Company not found" } },
    });

    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret");

    expect(await screen.findByText("Company not found")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows the backend message and a login link when the token is rejected", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: { status: 400, data: { message: "Invalid token" } },
    });

    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret");

    expect(await screen.findByText("Invalid token")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir para o login" })
    ).toHaveAttribute("href", "/login");
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("explains that the account exists when the automatic sign-in fails", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      admin: { id: "a2", email: "second@acme.com", companyId: "c1" },
    });
    signInMock.mockResolvedValueOnce({ ok: false });

    render(<CompanyAdminInvitePage />);
    await fillAndSubmit("supersecret");

    expect(
      await screen.findByText(
        "Convite aceito, mas não foi possível entrar automaticamente. Entre pelo login."
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
