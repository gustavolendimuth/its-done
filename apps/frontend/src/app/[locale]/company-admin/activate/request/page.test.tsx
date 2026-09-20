import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import CompanyAdminActivationRequestPage from "./page";

const mutateAsyncMock = jest.fn();
let companyIdParam: string | null = "company-1";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "companyId" ? companyIdParam : null),
  }),
}));

jest.mock("@/features/company-admin", () => ({
  useRequestCompanyActivation: jest.fn(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

const SUBMIT = "Enviar link de ativação";

describe("CompanyAdminActivationRequestPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    companyIdParam = "company-1";
  });

  it("requests activation with the companyId and email, omitting a blank domain", async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      message: "If eligible, a confirmation link has been sent.",
    });

    render(<CompanyAdminActivationRequestPage />);
    await userEvent.type(screen.getByLabelText("Email"), "contato@acme.com");
    await userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      companyId: "company-1",
      email: "contato@acme.com",
      domain: undefined,
    });
    expect(
      await screen.findByText(/enviamos um link de confirmação/)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("sends the domain when it is filled in", async () => {
    mutateAsyncMock.mockResolvedValueOnce({ message: "ok" });

    render(<CompanyAdminActivationRequestPage />);
    await userEvent.type(screen.getByLabelText("Email"), "ana@acme.com");
    await userEvent.type(
      screen.getByLabelText("Domínio da Empresa (opcional)"),
      "acme.com"
    );
    await userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      companyId: "company-1",
      email: "ana@acme.com",
      domain: "acme.com",
    });
  });

  it("shows an error and no form when the companyId is missing", () => {
    companyIdParam = null;

    render(<CompanyAdminActivationRequestPage />);

    expect(
      screen.getByText("Link inválido: a Empresa não foi identificada.")
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("keeps the form and shows the backend message on 400", async () => {
    mutateAsyncMock.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message:
            "The email must match the Company's registered contact email, or a domain must be declared",
        },
      },
    });

    render(<CompanyAdminActivationRequestPage />);
    await userEvent.type(screen.getByLabelText("Email"), "outro@acme.com");
    await userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(
      await screen.findByText(/must match the Company's registered contact email/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("outro@acme.com");
  });
});
