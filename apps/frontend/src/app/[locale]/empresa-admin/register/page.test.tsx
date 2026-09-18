import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import EmpresaAdminRegisterPage from "./page";

const pushMock = jest.fn();
const registerMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/features/empresa-admin", () => ({
  useEmpresaAdminAuth: () => ({ register: registerMock }),
}));

describe("EmpresaAdminRegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers, authenticates through the same session mechanism as login, and redirects straight to the dashboard", async () => {
    registerMock.mockResolvedValueOnce(undefined);

    render(<EmpresaAdminRegisterPage />);

    await userEvent.type(screen.getByLabelText("Empresa"), "Acme Inc");
    await userEvent.type(screen.getByLabelText("Email"), "admin@acme.com");
    await userEvent.type(screen.getByLabelText("Senha"), "supersecret");
    await userEvent.click(
      screen.getByRole("button", { name: "Criar conta" })
    );

    expect(registerMock).toHaveBeenCalledWith(
      "Acme Inc",
      "admin@acme.com",
      "supersecret"
    );
    expect(pushMock).toHaveBeenCalledWith("/empresa-admin/dashboard");
  });

  it("shows the backend's 409 error message and keeps the entered fields", async () => {
    registerMock.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: "An EmpresaAdmin already exists with this email" },
      },
    });

    render(<EmpresaAdminRegisterPage />);

    await userEvent.type(screen.getByLabelText("Empresa"), "Acme Inc");
    await userEvent.type(screen.getByLabelText("Email"), "admin@acme.com");
    await userEvent.type(screen.getByLabelText("Senha"), "supersecret");
    await userEvent.click(
      screen.getByRole("button", { name: "Criar conta" })
    );

    expect(
      await screen.findByText(
        "An EmpresaAdmin already exists with this email"
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    expect(screen.getByLabelText("Empresa")).toHaveValue("Acme Inc");
    expect(screen.getByLabelText("Email")).toHaveValue("admin@acme.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("supersecret");
  });
});
