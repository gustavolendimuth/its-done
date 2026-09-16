import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TaskCreateDialog } from "./task-create-dialog";

import type { Client } from "@/features/clients";
import type { Task, CreateTaskData } from "./tasks.service";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCreateTask = jest.fn((data: CreateTaskData): Promise<Task> => {
  return Promise.resolve({
    id: "task-1",
    title: data.title,
    link: data.link,
    clientId: data.clientId,
    projectId: data.projectId,
    userId: "user1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    client: mockClients.find((c) => c.id === data.clientId)!,
  });
});

jest.mock("./tasks.service", () => ({
  useCreateTask: jest.fn(() => ({
    mutateAsync: mockCreateTask,
    isPending: false,
  })),
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
];

jest.mock("@/features/clients", () => ({
  useClients: () => ({ data: mockClients, isLoading: false }),
}));

const mockProjects = [
  { id: "p1", name: "estafeito.app" },
  { id: "p2", name: "other-project.app" },
];

jest.mock("@/features/projects", () => ({
  useProjects: () => ({ data: mockProjects, isLoading: false }),
}));

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
      {mockProjects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  ),
}));

describe("TaskCreateDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
    clientId: "1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<TaskCreateDialog {...defaultProps} />);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("enterTitle")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("enterLink")).toBeInTheDocument();
  });

  it("requires a title before submitting", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it("auto-fills the title from a pasted Jira link (key only)", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    const linkInput = screen.getByPlaceholderText("enterLink");
    fireEvent.change(linkInput, {
      target: { value: "https://acme.atlassian.net/browse/PROJ-123" },
    });
    fireEvent.blur(linkInput);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("enterTitle")).toHaveValue("PROJ-123");
    });
  });

  it("auto-fills the title from a pasted Linear link (key + de-slugified title)", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    const linkInput = screen.getByPlaceholderText("enterLink");
    fireEvent.change(linkInput, {
      target: { value: "https://linear.app/acme/issue/ENG-42/fix-login-bug" },
    });
    fireEvent.blur(linkInput);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("enterTitle")).toHaveValue(
        "ENG-42 Fix login bug"
      );
    });
  });

  it("suggests no title for a generic URL, leaving the field for the user", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    const linkInput = screen.getByPlaceholderText("enterLink");
    fireEvent.change(linkInput, {
      target: { value: "https://github.com/acme/repo/issues/9" },
    });
    fireEvent.blur(linkInput);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("enterTitle")).toHaveValue("");
    });
  });

  it("the suggested title remains freely editable", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    const linkInput = screen.getByPlaceholderText("enterLink");
    fireEvent.change(linkInput, {
      target: { value: "https://acme.atlassian.net/browse/PROJ-123" },
    });
    fireEvent.blur(linkInput);

    const titleInput = screen.getByPlaceholderText("enterTitle");
    await waitFor(() => expect(titleInput).toHaveValue("PROJ-123"));

    await userEvent.type(titleInput, ": fix broken login");
    expect(titleInput).toHaveValue("PROJ-123: fix broken login");
  });

  it("prefixes the title with the project name when a project is marked", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });

    const titleInput = screen.getByPlaceholderText("enterTitle");
    await userEvent.type(titleInput, "PROJ-123");

    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "p1" },
    });

    await waitFor(() => {
      expect(titleInput).toHaveValue("[estafeito.app] PROJ-123");
    });
  });

  it("does not reapply the prefix when the project is changed again afterward", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });

    const titleInput = screen.getByPlaceholderText("enterTitle");
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "p1" },
    });

    await waitFor(() =>
      expect(titleInput).toHaveValue("[estafeito.app] ")
    );

    await userEvent.type(titleInput, "Fix login bug");
    expect(titleInput).toHaveValue("[estafeito.app] Fix login bug");

    // Unmarking the project must not strip/reapply the already-typed prefix.
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "" },
    });
    expect(titleInput).toHaveValue("[estafeito.app] Fix login bug");
  });

  it("does not stack a second prefix when a different project is selected afterward", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });

    const titleInput = screen.getByPlaceholderText("enterTitle");
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "p1" },
    });

    await waitFor(() => expect(titleInput).toHaveValue("[estafeito.app] "));

    // Swapping to a different project must not touch the title again.
    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "p2" },
    });
    expect(titleInput).toHaveValue("[estafeito.app] ");
  });

  it("submits with clientId, title and optional projectId/link", async () => {
    render(<TaskCreateDialog {...defaultProps} />);

    fireEvent.change(screen.getByTestId("client-combobox"), {
      target: { value: "1" },
    });
    await userEvent.type(screen.getByPlaceholderText("enterTitle"), "Fix bug");

    fireEvent.click(screen.getByRole("button", { name: "create" }));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: "Fix bug",
        clientId: "1",
        projectId: undefined,
        link: undefined,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});
