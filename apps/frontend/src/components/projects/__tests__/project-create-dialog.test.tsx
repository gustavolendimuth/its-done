import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProjectCreateDialog } from "../project-create-dialog";

import type { Client } from "@/services/clients";
import type { Project, CreateProjectData } from "@/services/projects";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock services
const mockCreateProject = jest.fn(
  (data: CreateProjectData): Promise<Project> => {
    return Promise.resolve({
      id: "1",
      name: data.name,
      description: data.description,
      clientId: data.clientId,
      userId: "user1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: mockClients.find((c) => c.id === data.clientId)!,
      _count: {
        workHours: 0,
      },
    });
  }
);

jest.mock("@/services/projects", () => ({
  useCreateProject: () => ({
    mutateAsync: mockCreateProject,
    isPending: false,
  }),
}));

const mockClients: Client[] = [
  {
    id: "1",
    name: "John Doe",
    company: "Company A",
    email: "john@example.com",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    company: "Company B",
    email: "jane@example.com",
    createdAt: "2024-03-02T00:00:00Z",
    updatedAt: "2024-03-02T00:00:00Z",
  },
];

jest.mock("@/services/clients", () => ({
  useClients: () => ({
    data: mockClients,
    isLoading: false,
  }),
}));

// Mock components
jest.mock("@/components/ui/client-combobox", () => ({
  ClientCombobox: ({
    value,
    onSelect,
    placeholder,
  }: {
    value: string;
    onSelect: (value: string) => void;
    placeholder: string;
  }) => (
    <select
      data-testid="client-combobox"
      value={value}
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {mockClients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.company}
        </option>
      ))}
    </select>
  ),
}));

describe("ProjectCreateDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<ProjectCreateDialog {...defaultProps} />);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("client-combobox")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("enterName")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("enterDescription")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "create" })
    ).toBeInTheDocument();
  });

  it("renders with preselected client", () => {
    render(<ProjectCreateDialog {...defaultProps} clientId="1" />);

    expect(screen.getByTestId("client-combobox")).toHaveValue("1");
  });

  it("validates required fields", async () => {
    render(<ProjectCreateDialog {...defaultProps} />);

    // Submit without filling required fields
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    // Wait for validation messages
    await waitFor(() => {
      expect(screen.getByText("Project name is required")).toBeInTheDocument();
      expect(screen.getByText("Client is required")).toBeInTheDocument();
    });
  });

  it("handles form submission successfully", async () => {
    const mockProject: Project = {
      id: "1",
      name: "Test Project",
      description: "Test Description",
      clientId: "1",
      userId: "user1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: mockClients[0],
      _count: {
        workHours: 0,
      },
    };
    mockCreateProject.mockResolvedValueOnce(mockProject);

    render(<ProjectCreateDialog {...defaultProps} />);

    // Fill form
    await userEvent.type(
      screen.getByPlaceholderText("enterName"),
      "Test Project"
    );
    await userEvent.type(
      screen.getByPlaceholderText("enterDescription"),
      "Test Description"
    );
    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    // Wait for submission and callback
    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: "Test Project",
        description: "Test Description",
        clientId: "1",
        hourlyRate: undefined
      });
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockProject);
      const { toast } = require("sonner");
      expect(toast.success).toHaveBeenCalledWith("success");
    });
  });

  it("handles form submission error", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockCreateProject.mockRejectedValueOnce(new Error("API Error"));

    render(<ProjectCreateDialog {...defaultProps} />);

    // Fill form
    await userEvent.type(
      screen.getByPlaceholderText("enterName"),
      "Test Project"
    );
    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    // Wait for error handling
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Error creating project:",
        expect.any(Error)
      );
      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      const { toast } = require("sonner");
      expect(toast.error).toHaveBeenCalledWith("error");
    });

    consoleError.mockRestore();
  });

  it("handles dialog close", () => {
    render(<ProjectCreateDialog {...defaultProps} />);

    // Click cancel button
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables submit button while creating", () => {
    const { rerender } = render(<ProjectCreateDialog {...defaultProps} />);

    // Initial state
    expect(
      screen.getByRole("button", { name: "create" })
    ).not.toBeDisabled();

    // Mock pending state
    jest.mock("@/services/projects", () => ({
      useCreateProject: () => ({
        mutateAsync: mockCreateProject,
        isPending: true,
      }),
    }));

    // Re-render with pending state
    rerender(<ProjectCreateDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: "creating" })).toBeDisabled();
  });

  it("resets form on successful submission", async () => {
    const mockProject: Project = {
      id: "1",
      name: "Test Project",
      description: "Test Description",
      clientId: "1",
      userId: "user1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: mockClients[0],
      _count: {
        workHours: 0,
      },
    };
    mockCreateProject.mockResolvedValueOnce(mockProject);

    render(<ProjectCreateDialog {...defaultProps} />);

    // Fill form
    await userEvent.type(
      screen.getByPlaceholderText("enterName"),
      "Test Project"
    );
    await userEvent.type(
      screen.getByPlaceholderText("enterDescription"),
      "Test Description"
    );
    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    // Wait for form reset
    await waitFor(() => {
      expect(screen.getByPlaceholderText("enterName")).toHaveValue("");
      expect(
        screen.getByPlaceholderText("enterDescription")
      ).toHaveValue("");
      expect(screen.getByTestId("client-combobox")).toHaveValue("");
    });
  });
});
