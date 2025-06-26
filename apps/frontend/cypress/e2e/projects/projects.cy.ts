describe("Projects Page", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.visit("/projects");
  });

  it("should display projects list and stats", () => {
    // Check page header
    cy.get('[data-testid="page-header"]').should("be.visible");
    cy.contains("Projects").should("be.visible");

    // Check stats
    cy.get('[data-testid="projects-big-stats"]').should("be.visible");
  });

  it("should create a new project", () => {
    // First create a client if none exists
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        cy.createClient("Test Client", "test@example.com", "Test Company");
      }
    });

    // Create project
    const projectName = `Test Project ${Date.now()}`;
    cy.contains("button", "Add Project").click();
    cy.get('select[data-testid="client-combobox"]').select(1);
    cy.get('input[placeholder="Enter project name"]').type(projectName);
    cy.get('textarea[placeholder="Enter project description (optional)"]').type(
      "Test Description"
    );
    cy.contains("button", "Create Project").click();

    // Verify project was created
    cy.contains(projectName).should("be.visible");
  });

  it("should filter projects by client", () => {
    // Create two clients and projects if none exist
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        // Create clients
        cy.createClient("Client A", "clienta@example.com", "Company A");
        cy.createClient("Client B", "clientb@example.com", "Company B");

        // Create projects
        cy.createProject("Project A", "Description A", "1");
        cy.createProject("Project B", "Description B", "2");
      }
    });

    // Filter by first client
    cy.get('[role="combobox"]').click();
    cy.contains("Company A").click();

    // Verify filtered results
    cy.get('[data-testid="project-card"]').should("have.length", 1);
    cy.contains("Project A").should("be.visible");
    cy.contains("Project B").should("not.exist");
  });

  it("should delete a project", () => {
    // Create a project if none exists
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        cy.createClient("Test Client", "test@example.com", "Test Company");
        cy.createProject("Project to Delete", "Description", "1");
      }
    });

    // Delete the first project
    cy.get('[data-testid="project-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });

    // Confirm deletion
    cy.contains("button", "Delete Project").click();

    // Verify project was deleted
    cy.contains("Project to Delete").should("not.exist");
  });

  it("should show empty state when no projects", () => {
    // Delete all projects first
    cy.get('[data-testid="project-card"]').each(($card) => {
      cy.wrap($card).within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });
      cy.contains("button", "Delete Project").click();
    });

    // Verify empty state
    cy.get('[data-testid="empty-state"]').should("be.visible");
    cy.contains("No projects found").should("be.visible");
    cy.contains("Create your first project").should("be.visible");
  });
});
