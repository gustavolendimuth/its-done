import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import EmpresaAdminResetPasswordPage from "./page";

const pushMock = jest.fn();
const mutateAsyncMock = jest.fn();
let tokenParam: string | null = "valid-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? tokenParam : null),
  }),
}));

jest.mock("@/features/empresa-admin", () => ({
  useResetPasswordEmpresaAdmin: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

describe("EmpresaAdminResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenParam = "valid-token";
  });

  it("submits the new password with the token, shows confirmation and redirects to login", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    mutateAsyncMock.mockResolvedValueOnce({
      message: "Password reset successfully",
    });

    render(<EmpresaAdminResetPasswordPage />);

    await userEvent.type(screen.getByLabelText("Nova senha"), "newpass123");
    await userEvent.type(
      screen.getByLabelText("Confirmar nova senha"),
      "newpass123"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Redefinir senha" })
    );

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      token: "valid-token",
      newPassword: "newpass123",
    });
    expect(
      await screen.findByText(/Senha redefinida com sucesso/)
    ).toBeInTheDocument();

    jest.advanceTimersByTime(3000);
    expect(pushMock).toHaveBeenCalledWith("/empresa-admin/login");

    jest.useRealTimers();
  });

  it("shows an error and a link back to forgot-password when the token is missing", () => {
    tokenParam = null;

    render(<EmpresaAdminResetPasswordPage />);

    expect(
      screen.getByText("Link de redefinição inválido ou incompleto.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Pedir um novo link/ })
    ).toHaveAttribute("href", "/empresa-admin/forgot-password");
    expect(
      screen.queryByRole("button", { name: "Redefinir senha" })
    ).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows an error from the backend and a link back to forgot-password when the token is invalid or expired", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: { status: 400, data: { message: "Reset token has expired" } },
    });

    render(<EmpresaAdminResetPasswordPage />);

    await userEvent.type(screen.getByLabelText("Nova senha"), "newpass123");
    await userEvent.type(
      screen.getByLabelText("Confirmar nova senha"),
      "newpass123"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Redefinir senha" })
    );

    expect(
      await screen.findByText("Reset token has expired")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Pedir um novo link/ })
    ).toHaveAttribute("href", "/empresa-admin/forgot-password");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
