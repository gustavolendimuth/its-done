import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TaskEditDialog } from "./task-edit-dialog";

import type { Task, UpdateTaskData } from "./tasks.service";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockUpdateTask = jest.fn(
  (data: { id: string; data: UpdateTaskData }): Promise<Task> => {
    return Promise.resolve({
      id: data.id,
      title: data.data.title ?? "Fix bug",
      link: data.data.link,
      clientId: data.data.clientId ?? "1",
      projectId: data.data.projectId,
      userId: "user1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: mockClient,
    });
  }
);

jest.mock("./tasks.service", () => ({
  useUpdateTask: jest.fn(() => ({
    mutateAsync: mockUpdateTask,
    isPending: false,
  })),
}));

const mockClient = {
  id: "1",
  name: "John Doe",
  company: "Company A",
  email: "john@example.com",
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
};

const mockProjects = [
  { id: "p1", name: "estafeito.app" },
  { id: "p2", name: "other-project.app" },
];

jest.mock("@/features/projects", () => ({
  useProjects: () => ({ data: mockProjects, isLoading: false }),
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

const baseTask: Task = {
  id: "task-1",
  title: "Fix login bug",
  link: "https://acme.atlassian.net/browse/PROJ-123",
  clientId: "1",
  userId: "user1",
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
  client: mockClient,
};

describe("TaskEditDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSuccess: jest.fn(),
    task: baseTask,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("pre-fills title and link from the task", () => {
    render(<TaskEditDialog {...defaultProps} />);

    expect(screen.getByDisplayValue("Fix login bug")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://acme.atlassian.net/browse/PROJ-123")
    ).toBeInTheDocument();
  });

  it("submits the edited title", async () => {
    render(<TaskEditDialog {...defaultProps} />);

    const titleInput = screen.getByDisplayValue("Fix login bug");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Fix login bug for real");

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: "task-1",
        data: expect.objectContaining({ title: "Fix login bug for real" }),
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it("prefixes the title with the project name when a project is (re)marked", async () => {
    render(<TaskEditDialog {...defaultProps} />);

    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "p1" },
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("[estafeito.app] Fix login bug")).toBeInTheDocument();
    });
  });

  it("does not stack a second prefix when a different project is selected afterward", async () => {
    render(<TaskEditDialog {...defaultProps} />);

    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "p1" },
    });
    await waitFor(() =>
      expect(
        screen.getByDisplayValue("[estafeito.app] Fix login bug")
      ).toBeInTheDocument()
    );

    fireEvent.change(screen.getByTestId("project-combobox"), {
      target: { value: "p2" },
    });
    expect(
      screen.getByDisplayValue("[estafeito.app] Fix login bug")
    ).toBeInTheDocument();
  });

  it("shows the task's client as read-only, not editable", () => {
    render(<TaskEditDialog {...defaultProps} />);

    expect(screen.getByText("Company A")).toBeInTheDocument();
    expect(screen.queryByTestId("client-combobox")).not.toBeInTheDocument();
  });
});
