import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import SettingsPage from "../page";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock components
jest.mock("@/components/settings/settings-form", () => ({
  SettingsForm: () => <div data-testid="settings-form">Settings Form</div>,
}));

jest.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
}));

jest.mock("@/components/ui/info-card", () => ({
  InfoCard: ({
    title,
    description,
    variant,
  }: {
    title: string;
    description: string;
    variant: string;
  }) => (
    <div data-testid="info-card" className={variant}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

describe("SettingsPage", () => {
  it("should render the page with all components", () => {
    render(<SettingsPage />);

    // Check page container
    expect(screen.getByTestId("page-container")).toBeInTheDocument();

    // Check header
    expect(screen.getByTestId("page-header")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();

    // Check info card
    const infoCard = screen.getByTestId("info-card");
    expect(infoCard).toBeInTheDocument();
    expect(infoCard).toHaveClass("info");
    expect(screen.getByText("infoTitle")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();

    // Check settings form
    expect(screen.getByTestId("settings-form")).toBeInTheDocument();
    expect(screen.getByText("Settings Form")).toBeInTheDocument();

    // Check preferences section
    expect(screen.getByText("preferences")).toBeInTheDocument();
  });
});
