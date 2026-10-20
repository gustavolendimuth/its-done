import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminForgotPasswordPage from "./page";

const mutateAsyncMock = jest.fn();

jest.mock("@/features/company-admin", () => ({
  useForgotPasswordCompanyAdmin: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

describe("CompanyAdminForgotPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits the email and always shows the backend's generic message", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      message: "If the email exists, a reset link has been sent.",
    });

    render(<CompanyAdminForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText("Email"), "admin@acme.com");
    await userEvent.click(
      screen.getByRole("button", { name: /Enviar link de recuperação/ })
    );

    expect(mutateAsyncMock).toHaveBeenCalledWith({ email: "admin@acme.com" });
    expect(
      await screen.findByText(
        "If the email exists, a reset link has been sent."
      )
    ).toBeInTheDocument();
  });
});
