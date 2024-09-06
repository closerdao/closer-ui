/* eslint-disable no-undef */

const login = () => {
  cy.get('input[aria-label*="Email"]').type(Cypress.env('TEST_USER_EMAIL'));
  cy.get('input[aria-label*="Password"]').type(Cypress.env('TEST_USER_PASSWORD'));
  cy.contains('button', 'Log in').click();
  cy.wait(2000);
}

describe('Log in process', () => {
  it('should log in and redirect to home page', () => {

    cy.visit(`${Cypress.config('baseUrl')}/login`);
    cy.get('h1').contains('Log in');

    login();

    cy.url().should('equal', `${Cypress.config('baseUrl')}/`);
  });
});
