import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { WorkSessionStartForm } from "./work-session-start-form";

import type { Client } from "@/features/clients";

const mockOnStart = jest.fn();

// Mirrors the project's established next-intl test pattern (see
// project-edit-dialog.test.tsx): the mock returns the raw key.
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockClients: Client[] = [
  {
    id: "client-1",
    company: "Acme",
    email: "acme@example.com",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

jest.mock("@/features/clients", () => ({
  useClients: () => ({ data: mockClients }),
}));

jest.mock("@/components/ui/client-combobox", () => ({
  ClientCombobox: ({
    value,
    onSelect,
  }: {
    value: string;
    onSelect: (value: string) => void;
  }) => (
    <select
      data-testid="client-combobox"
      value={value}
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="">select client</option>
      <option value="client-1">Acme</option>
    </select>
  ),
}));

jest.mock("@/components/ui/project-combobox", () => ({
  ProjectCombobox: ({
    value,
    onSelect,
  }: {
    value?: string;
    onSelect: (value: string | null) => void;
  }) => (
    <select
      data-testid="project-combobox"
      value={value ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
    >
      <option value="">no project</option>
      <option value="project-1">Website</option>
    </select>
  ),
}));

describe("WorkSessionStartForm", () => {
  const originalOnLine = window.navigator.onLine;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: originalOnLine,
    });
  });

  it("blocks submit and shows the missing-client message when description is filled but client is empty", async () => {
    render(<WorkSessionStartForm onCancel={jest.fn()} onStart={mockOnStart} />);

    fireEvent.change(screen.getByPlaceholderText("descriptionPlaceholder"), {
      target: { value: "About to work on the landing page" },
    });
    fireEvent.click(screen.getByRole("button", { name: "start" }));

    await waitFor(() => {
      expect(screen.getByText("clientRequired")).toBeInTheDocument();
    });
    expect(mockOnStart).not.toHaveBeenCalled();
  });

  it("calls onStart with the filled details on a valid submit", async () => {
    render(<WorkSessionStartForm onCancel={jest.fn()} onStart={mockOnStart} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "project-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("descriptionPlaceholder"), {
      target: { value: "About to work on the landing page" },
    });
    fireEvent.click(screen.getByRole("button", { name: "start" }));

    await waitFor(() => {
      expect(mockOnStart).toHaveBeenCalledWith({
        clientId: "client-1",
        projectId: "project-1",
        description: "About to work on the landing page",
      });
    });
  });

  it("calls onCancel without starting a session when cancel is clicked", () => {
    const onCancel = jest.fn();
    render(<WorkSessionStartForm onCancel={onCancel} onStart={mockOnStart} />);

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(mockOnStart).not.toHaveBeenCalled();
  });

  it("shows an offline placeholder with a cancel button instead of the form when offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    const onCancel = jest.fn();

    render(<WorkSessionStartForm onCancel={onCancel} onStart={mockOnStart} />);

    expect(
      screen.getByTestId("work-session-start-form-offline")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("client-combobox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
