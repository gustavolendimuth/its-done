// Import commands.js using ES2015 syntax:
import "./commands";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login using UI
       * @example cy.login('john@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login by setting the session token directly
       * @example cy.loginByApi()
       */
      loginByApi(): Chainable<void>;

      /**
       * Custom command to create a new project
       * @example cy.createProject('Project Name', 'Description', 'client-id')
       */
      createProject(
        name: string,
        description: string,
        clientId: string
      ): Chainable<void>;

      /**
       * Custom command to create a new client
       * @example cy.createClient('Client Name', 'client@example.com', 'Company Name')
       */
      createClient(
        name: string,
        email: string,
        company: string
      ): Chainable<void>;

      /**
       * Custom command to create a new work hour entry
       * @example cy.createWorkHour('2024-03-10', 8, 'project-id', 'Description')
       */
      createWorkHour(
        date: string,
        hours: number,
        projectId: string,
        description: string
      ): Chainable<void>;
    }
  }
}
