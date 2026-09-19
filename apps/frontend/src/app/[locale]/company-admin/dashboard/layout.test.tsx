import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import "@testing-library/jest-dom";
import CompanyAdminDashboardLayout from "./layout";

const useSessionMock = jest.fn();
const replaceMock = jest.fn();
const pushMock = jest.fn();
const signOutMock = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
}));

describe("CompanyAdminDashboardLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when the session actor type is COMPANY_ADMIN", () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "admin@acme.com", actorType: "COMPANY_ADMIN" } },
      status: "authenticated",
    });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    expect(screen.getByText("dashboard content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("dashboard content")).not.toBeInTheDocument();
  });

  it("redirects to /login when the session belongs to a plain User", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "user@test.local", actorType: "USER" } },
      status: "authenticated",
    });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
  });

  it("shows a loading state while the session is resolving", () => {
    useSessionMock.mockReturnValue({ data: undefined, status: "loading" });

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("signs out through NextAuth and returns to /login", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "admin@acme.com", actorType: "COMPANY_ADMIN" } },
      status: "authenticated",
    });
    signOutMock.mockResolvedValueOnce(undefined);

    render(
      <CompanyAdminDashboardLayout>
        <p>dashboard content</p>
      </CompanyAdminDashboardLayout>
    );
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false })
    );
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
