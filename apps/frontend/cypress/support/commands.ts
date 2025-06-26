/// <reference types="cypress" />

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/login");
});

Cypress.Commands.add("loginByApi", () => {
  cy.request("POST", "/api/auth/login", {
    email: Cypress.env("TEST_USER_EMAIL"),
    password: Cypress.env("TEST_USER_PASSWORD"),
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem("token", response.body.token);
  });
});

Cypress.Commands.add(
  "createProject",
  (name: string, description: string, clientId: string) => {
    cy.visit("/projects");
    cy.contains("button", "Add Project").click();
    cy.get('select[data-testid="client-combobox"]').select(clientId);
    cy.get('input[placeholder="Enter project name"]').type(name);
    cy.get('textarea[placeholder="Enter project description (optional)"]').type(
      description
    );
    cy.contains("button", "Create Project").click();
    cy.contains(name).should("be.visible");
  }
);

Cypress.Commands.add(
  "createClient",
  (name: string, email: string, company: string) => {
    cy.visit("/clients");
    cy.contains("button", "Add Client").click();
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="company"]').type(company);
    cy.contains("button", "Create Client").click();
    cy.contains(company).should("be.visible");
  }
);

Cypress.Commands.add(
  "createWorkHour",
  (date: string, hours: number, projectId: string, description: string) => {
    cy.visit("/work-hours");
    cy.contains("button", "Add Work Hours").click();
    cy.get('input[name="date"]').type(date);
    cy.get('input[name="hours"]').type(hours.toString());
    cy.get('select[name="projectId"]').select(projectId);
    cy.get('textarea[name="description"]').type(description);
    cy.contains("button", "Create").click();
    cy.contains(description).should("be.visible");
  }
);
