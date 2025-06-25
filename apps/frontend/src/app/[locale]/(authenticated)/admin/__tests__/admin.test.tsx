import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdminPage from "../page";

// Mock dependencies
jest.mock("next-auth/react");
jest.mock("next/navigation");
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock("@/services/admin", () => ({
  useSystemStats: () => ({
    data: {
      users: { total: 10, admins: 2, regular: 8 },
      clients: 5,
      projects: 3,
      workHours: { total: 100, totalHours: 250.5 },
      invoices: { total: 20, pending: 5, paid: 15 },
      revenue: 5000,
    },
    isLoading: false,
  }),
}));

// Mock child components
jest.mock("../users", () => ({
  __esModule: true,
  default: () => <div>Admin Users Component</div>,
}));
jest.mock("../activity", () => ({
  __esModule: true,
  default: () => <div>Admin Activity Component</div>,
}));

describe("AdminPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect non-admin users to dashboard", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { role: "USER" },
      },
    });

    render(<AdminPage />);

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("should render admin page for admin users", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { role: "ADMIN" },
      },
    });

    render(<AdminPage />);

    // Check for page title
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();

    // Check for tabs
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Users" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Recent Activity" })
    ).toBeInTheDocument();

    // Check for stats cards
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2 admins, 8 regular")).toBeInTheDocument();

    expect(screen.getByText("Total Clients")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$5000.00")).toBeInTheDocument();
  });

  it("should show loading skeletons when data is loading", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { role: "ADMIN" },
      },
    });

    // Mock loading state
    jest.doMock("@/services/admin", () => ({
      useSystemStats: () => ({
        data: null,
        isLoading: true,
      }),
    }));

    render(<AdminPage />);

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId("skeleton");

    expect(skeletons.length).toBeGreaterThan(0);
  });
});
