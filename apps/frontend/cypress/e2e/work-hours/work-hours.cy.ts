describe("Work Hours Page", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.visit("/work-hours");
  });

  it("should display work hours list", () => {
    cy.get('[data-testid="page-header"]').should("be.visible");
    cy.contains("Work Hours").should("be.visible");
  });

  it("should create a new work hour entry", () => {
    // First create a client and project if none exists
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        cy.createClient("Test Client", "test@example.com", "Test Company");
        cy.createProject("Test Project", "Description", "1");
      }
    });

    // Create work hour entry
    cy.contains("button", "Add Work Hours").click();

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    cy.get('input[name="date"]').type(formattedDate);
    cy.get('input[name="hours"]').type("8");
    cy.get('select[name="projectId"]').select(1);
    cy.get('textarea[name="description"]').type("Test work hour entry");
    cy.contains("button", "Create").click();

    // Verify work hour was created
    cy.contains("Test work hour entry").should("be.visible");
    cy.contains("8h").should("be.visible");
  });

  it("should filter work hours by date range", () => {
    // Create work hour entries if none exist
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        cy.createClient("Test Client", "test@example.com", "Test Company");
        cy.createProject("Test Project", "Description", "1");

        // Create entries for different dates
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        cy.createWorkHour(
          today.toISOString().split("T")[0],
          8,
          "1",
          "Today's work"
        );
        cy.createWorkHour(
          yesterday.toISOString().split("T")[0],
          4,
          "1",
          "Yesterday's work"
        );
      }
    });

    // Filter by today
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    cy.get('input[name="startDate"]').type(formattedDate);
    cy.get('input[name="endDate"]').type(formattedDate);

    // Verify filtered results
    cy.contains("Today's work").should("be.visible");
    cy.contains("Yesterday's work").should("not.exist");
  });

  it("should delete a work hour entry", () => {
    // Create a work hour entry if none exists
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        cy.createClient("Test Client", "test@example.com", "Test Company");
        cy.createProject("Test Project", "Description", "1");
        cy.createWorkHour(
          new Date().toISOString().split("T")[0],
          8,
          "1",
          "Entry to delete"
        );
      }
    });

    // Delete the first entry
    cy.get('[data-testid="work-hour-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });

    // Confirm deletion
    cy.contains("button", "Delete Entry").click();

    // Verify entry was deleted
    cy.contains("Entry to delete").should("not.exist");
  });

  it("should show empty state when no work hours", () => {
    // Delete all work hour entries
    cy.get('[data-testid="work-hour-card"]').each(($card) => {
      cy.wrap($card).within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });
      cy.contains("button", "Delete Entry").click();
    });

    // Verify empty state
    cy.get('[data-testid="empty-state"]').should("be.visible");
    cy.contains("No work hours found").should("be.visible");
    cy.contains("Add your first work hour entry").should("be.visible");
  });

  it("should show validation errors for invalid input", () => {
    cy.contains("button", "Add Work Hours").click();
    cy.contains("button", "Create").click();

    // Verify validation errors
    cy.contains("Date is required").should("be.visible");
    cy.contains("Hours is required").should("be.visible");
    cy.contains("Project is required").should("be.visible");
    cy.contains("Description is required").should("be.visible");

    // Test invalid hours
    cy.get('input[name="hours"]').type("25");
    cy.contains("button", "Create").click();
    cy.contains("Hours must be between 0 and 24").should("be.visible");
  });
});
