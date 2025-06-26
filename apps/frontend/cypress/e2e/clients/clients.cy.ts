describe("Clients Page", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.visit("/clients");
  });

  it("should display clients list", () => {
    cy.get('[data-testid="page-header"]').should("be.visible");
    cy.contains("Clients").should("be.visible");
  });

  it("should create a new client", () => {
    const clientName = `Test Client ${Date.now()}`;
    const clientEmail = `test${Date.now()}@example.com`;
    const clientCompany = `Test Company ${Date.now()}`;

    cy.contains("button", "Add Client").click();
    cy.get('input[name="name"]').type(clientName);
    cy.get('input[name="email"]').type(clientEmail);
    cy.get('input[name="company"]').type(clientCompany);
    cy.contains("button", "Create Client").click();

    // Verify client was created
    cy.contains(clientName).should("be.visible");
    cy.contains(clientEmail).should("be.visible");
    cy.contains(clientCompany).should("be.visible");
  });

  it("should show validation errors for invalid input", () => {
    cy.contains("button", "Add Client").click();
    cy.contains("button", "Create Client").click();

    // Verify validation errors
    cy.contains("Name is required").should("be.visible");
    cy.contains("Email is required").should("be.visible");
    cy.contains("Company is required").should("be.visible");

    // Test invalid email
    cy.get('input[name="name"]').type("Test Name");
    cy.get('input[name="email"]').type("invalid-email");
    cy.get('input[name="company"]').type("Test Company");
    cy.contains("button", "Create Client").click();
    cy.contains("Invalid email address").should("be.visible");
  });

  it("should delete a client", () => {
    // Create a client if none exists
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        cy.createClient(
          "Client to Delete",
          "delete@example.com",
          "Delete Company"
        );
      }
    });

    // Delete the first client
    cy.get('[data-testid="client-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });

    // Confirm deletion
    cy.contains("button", "Delete Client").click();

    // Verify client was deleted
    cy.contains("Client to Delete").should("not.exist");
  });

  it("should show empty state when no clients", () => {
    // Delete all clients
    cy.get('[data-testid="client-card"]').each(($card) => {
      cy.wrap($card).within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });
      cy.contains("button", "Delete Client").click();
    });

    // Verify empty state
    cy.get('[data-testid="empty-state"]').should("be.visible");
    cy.contains("No clients found").should("be.visible");
    cy.contains("Add your first client").should("be.visible");
  });

  it("should edit a client", () => {
    // Create a client if none exists
    cy.get('[data-testid="empty-state"]').then(($emptyState) => {
      if ($emptyState.length > 0) {
        cy.createClient("Client to Edit", "edit@example.com", "Edit Company");
      }
    });

    // Click edit button
    cy.get('[data-testid="client-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="edit-button"]').click();
      });

    // Edit client details
    const newName = `Edited Client ${Date.now()}`;
    const newEmail = `edited${Date.now()}@example.com`;
    const newCompany = `Edited Company ${Date.now()}`;

    cy.get('input[name="name"]').clear().type(newName);
    cy.get('input[name="email"]').clear().type(newEmail);
    cy.get('input[name="company"]').clear().type(newCompany);
    cy.contains("button", "Save Changes").click();

    // Verify changes
    cy.contains(newName).should("be.visible");
    cy.contains(newEmail).should("be.visible");
    cy.contains(newCompany).should("be.visible");
  });
});
