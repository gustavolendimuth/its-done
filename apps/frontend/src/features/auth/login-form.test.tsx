import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import "@testing-library/jest-dom";
import { LoginForm } from "./login-form";

const signInMock = jest.fn();
const getSessionMock = jest.fn();
const pushMock = jest.fn();

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  getSession: (...args: unknown[]) => getSessionMock(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

async function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "signIn" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends a User to /work-hours after a successful login", async () => {
    signInMock.mockResolvedValueOnce({ ok: true });
    getSessionMock.mockResolvedValueOnce({
      user: { email: "user@test.local", actorType: "USER" },
    });

    render(<LoginForm />);
    await fillAndSubmit("user@test.local", "password123");

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/work-hours"));
  });

  it("sends a CompanyAdmin to /company-admin/dashboard after a successful login", async () => {
    signInMock.mockResolvedValueOnce({ ok: true });
    getSessionMock.mockResolvedValueOnce({
      user: { email: "admin@acme.com", actorType: "COMPANY_ADMIN" },
    });

    render(<LoginForm />);
    await fillAndSubmit("admin@acme.com", "password123");

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/company-admin/dashboard")
    );
  });

  it("shows an inline error and does not navigate when credentials are invalid", async () => {
    signInMock.mockResolvedValueOnce({
      ok: false,
      error: "CredentialsSignin",
    });

    render(<LoginForm />);
    await fillAndSubmit("nobody@test.local", "wrong-password");

    expect(
      await screen.findByText("Invalid email or password.")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not render a separate company-admin login link", () => {
    render(<LoginForm />);

    expect(
      screen.queryByRole("link", { name: "companyAdminLink" })
    ).not.toBeInTheDocument();
  });
});
