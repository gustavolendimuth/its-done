import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminRegisterPage from "./page";

const pushMock = jest.fn();
const signInMock = jest.fn();
const fetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

global.fetch = fetchMock as unknown as typeof fetch;

describe("CompanyAdminRegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers, authenticates through the same session mechanism as login, and redirects straight to the dashboard", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admin: { id: "a1", email: "admin@acme.com", companyId: "c1" },
      }),
    });
    signInMock.mockResolvedValueOnce({ ok: true });

    render(<CompanyAdminRegisterPage />);

    await userEvent.type(screen.getByLabelText("Empresa"), "Acme Inc");
    await userEvent.type(screen.getByLabelText("Email"), "admin@acme.com");
    await userEvent.type(screen.getByLabelText("Senha"), "supersecret");
    await userEvent.click(
      screen.getByRole("button", { name: "Criar conta" })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/backend/company-admin/auth/register",
      expect.objectContaining({ method: "POST" })
    );
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "admin@acme.com",
      password: "supersecret",
      redirect: false,
    });
    expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard");
  });

  it("shows the backend's 409 error message and keeps the entered fields", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        message: "An CompanyAdmin already exists with this email",
      }),
    });

    render(<CompanyAdminRegisterPage />);

    await userEvent.type(screen.getByLabelText("Empresa"), "Acme Inc");
    await userEvent.type(screen.getByLabelText("Email"), "admin@acme.com");
    await userEvent.type(screen.getByLabelText("Senha"), "supersecret");
    await userEvent.click(
      screen.getByRole("button", { name: "Criar conta" })
    );

    expect(
      await screen.findByText(
        "An CompanyAdmin already exists with this email"
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();

    expect(screen.getByLabelText("Empresa")).toHaveValue("Acme Inc");
    expect(screen.getByLabelText("Email")).toHaveValue("admin@acme.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("supersecret");
  });
});
