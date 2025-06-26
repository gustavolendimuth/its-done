describe("Login Page", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display login form", () => {
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
    cy.get('button[type="submit"]').should("be.visible");
  });

  it("should show validation errors for empty fields", () => {
    cy.get('button[type="submit"]').click();
    cy.contains("Email is required").should("be.visible");
    cy.contains("Password is required").should("be.visible");
  });

  it("should show error for invalid credentials", () => {
    cy.get('input[name="email"]').type("invalid@example.com");
    cy.get('input[name="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();
    cy.contains("Invalid credentials").should("be.visible");
  });

  it("should login successfully with valid credentials", () => {
    cy.get('input[name="email"]').type(Cypress.env("TEST_USER_EMAIL"));
    cy.get('input[name="password"]').type(Cypress.env("TEST_USER_PASSWORD"));
    cy.get('button[type="submit"]').click();
    cy.url().should("not.include", "/login");
    cy.url().should("include", "/dashboard");
  });
});
