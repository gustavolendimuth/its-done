import { jest } from "@jest/globals";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProjectEditDialog } from "../project-edit-dialog";
import { render } from "@/test-utils";

import type { Client } from "@/services/clients";
import type { Project, UpdateProjectData } from "@/services/projects";

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

// Mock services
const mockUpdateProject = jest.fn(
  ({ id, data }: { id: string; data: UpdateProjectData }): Promise<Project> => {
    return Promise.resolve({
      id,
      name: data.name || "Test Project",
      description: data.description,
      hourlyRate: data.hourlyRate,
      clientId: data.clientId || "1",
      userId: "user1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: mockClients.find((c) => c.id === (data.clientId || "1"))!,
      _count: {
        workHours: 0,
      },
    });
  }
);

jest.mock("@/services/projects", () => ({
  useUpdateProject: () => ({
    mutateAsync: mockUpdateProject,
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

jest.mock("@/components/ui/form-modal", () => ({
  FormModal: ({ children, title, description }: any) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

describe("ProjectEditDialog", () => {
  const mockProject: Project = {
    id: "1",
    name: "Existing Project",
    description: "Existing Description",
    hourlyRate: 100,
    clientId: "1",
    userId: "user1",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    client: mockClients[0],
    _count: {
      workHours: 5,
    },
  };

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    project: mockProject,
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with project data", () => {
    render(<ProjectEditDialog {...defaultProps} />);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("formSubtitle")).toBeInTheDocument();
    expect(screen.getByTestId("client-combobox")).toHaveValue("1");
    expect(screen.getByDisplayValue("Existing Project")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Existing Description")
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "update" })).toBeInTheDocument();
  });

  it("renders with project without hourlyRate", () => {
    const projectWithoutRate = { ...mockProject, hourlyRate: null };
    render(<ProjectEditDialog {...defaultProps} project={projectWithoutRate} />);

    expect(screen.getByLabelText("hourlyRate")).toHaveValue(null);
  });

  it("renders with project without alertHours", () => {
    render(<ProjectEditDialog {...defaultProps} />);

    expect(screen.getByLabelText("alertHours")).toHaveValue(null);
  });

  it("validates required fields", async () => {
    render(<ProjectEditDialog {...defaultProps} />);

    // Clear required fields
    const nameInput = screen.getByDisplayValue("Existing Project");
    await userEvent.clear(nameInput);

    // Change client to empty
    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "update" }));

    // Wait for validation messages
    await waitFor(() => {
      expect(screen.getByText("Project name is required")).toBeInTheDocument();
      expect(screen.getByText("Client is required")).toBeInTheDocument();
    });
  });

  it("handles form submission successfully", async () => {
    const updatedProject: Project = {
      ...mockProject,
      name: "Updated Project",
      description: "Updated Description",
      hourlyRate: 150,
    };
    mockUpdateProject.mockResolvedValueOnce(updatedProject);

    render(<ProjectEditDialog {...defaultProps} />);

    // Update form fields
    const nameInput = screen.getByDisplayValue("Existing Project");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated Project");

    const descriptionInput = screen.getByDisplayValue("Existing Description");
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, "Updated Description");

    const hourlyRateInput = screen.getByDisplayValue("100");
    await userEvent.clear(hourlyRateInput);
    await userEvent.type(hourlyRateInput, "150");

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "update" }));

    // Wait for submission and callback
    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith({
        id: "1",
        data: {
          name: "Updated Project",
          description: "Updated Description",
          hourlyRate: 150,
          alertHours: undefined,
          clientId: "1",
        },
      });
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(updatedProject);
      const { toast } = require("sonner");
      expect(toast.success).toHaveBeenCalledWith("success");
    });
  });

  it("handles hourly rate update with decimal values", async () => {
    render(<ProjectEditDialog {...defaultProps} />);

    const hourlyRateInput = screen.getByDisplayValue("100");
    await userEvent.clear(hourlyRateInput);
    await userEvent.type(hourlyRateInput, "125.50");

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hourlyRate: 125.5,
          }),
        })
      );
    });
  });

  it("handles alertHours update", async () => {
    const projectWithAlertHours = {
      ...mockProject,
      alertHours: 160
    } as Project & { alertHours: number };

    const { rerender } = render(
      <ProjectEditDialog {...defaultProps} project={projectWithAlertHours} />
    );

    const alertHoursInput = screen.getByDisplayValue("160");
    await userEvent.clear(alertHoursInput);
    await userEvent.type(alertHoursInput, "200");

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            alertHours: 200,
          }),
        })
      );
    });
  });

  it("converts null values to undefined for API", async () => {
    const projectWithNullValues = {
      ...mockProject,
      hourlyRate: null,
    };
    render(<ProjectEditDialog {...defaultProps} project={projectWithNullValues} />);

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hourlyRate: undefined,
            alertHours: undefined,
          }),
        })
      );
    });
  });

  it("handles form submission error", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockUpdateProject.mockRejectedValueOnce(new Error("API Error"));

    render(<ProjectEditDialog {...defaultProps} />);

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "update" }));

    // Wait for error handling
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Error updating project:",
        expect.any(Error)
      );
      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      const { toast } = require("sonner");
      expect(toast.error).toHaveBeenCalledWith("error");
    });

    consoleError.mockRestore();
  });

  it("handles dialog close", () => {
    render(<ProjectEditDialog {...defaultProps} />);

    // Click cancel button
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets form when project changes", async () => {
    const { rerender } = render(<ProjectEditDialog {...defaultProps} />);

    expect(screen.getByDisplayValue("Existing Project")).toBeInTheDocument();

    const newProject: Project = {
      ...mockProject,
      id: "2",
      name: "New Project",
      description: "New Description",
      hourlyRate: 200,
    };

    rerender(<ProjectEditDialog {...defaultProps} project={newProject} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("New Project")).toBeInTheDocument();
      expect(screen.getByDisplayValue("New Description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("200")).toBeInTheDocument();
    });
  });

  it("handles client change", async () => {
    render(<ProjectEditDialog {...defaultProps} />);

    // Change client
    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "2" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientId: "2",
          }),
        })
      );
    });
  });

  it("validates negative hourly rate", async () => {
    render(<ProjectEditDialog {...defaultProps} />);

    const hourlyRateInput = screen.getByDisplayValue("100");
    await userEvent.clear(hourlyRateInput);
    await userEvent.type(hourlyRateInput, "-50");

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(
        screen.getByText("Hourly rate must be 0 or greater")
      ).toBeInTheDocument();
    });
  });

  it("validates negative alert hours", async () => {
    render(<ProjectEditDialog {...defaultProps} />);

    const alertHoursInput = screen.getByLabelText("alertHours");
    await userEvent.type(alertHoursInput, "-10");

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(
        screen.getByText("Alert hours must be 0 or greater")
      ).toBeInTheDocument();
    });
  });

  it("disables buttons while updating", () => {
    const pendingProps = {
      ...defaultProps,
    };

    jest.mock("@/services/projects", () => ({
      useUpdateProject: () => ({
        mutateAsync: mockUpdateProject,
        isPending: true,
      }),
    }));

    render(<ProjectEditDialog {...pendingProps} />);

    expect(screen.getByRole("button", { name: "updating" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "cancel" })).toBeDisabled();
  });

  it("handles empty optional fields correctly", async () => {
    render(<ProjectEditDialog {...defaultProps} />);

    // Clear description
    const descriptionInput = screen.getByDisplayValue("Existing Description");
    await userEvent.clear(descriptionInput);

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: "",
          }),
        })
      );
    });
  });
});
