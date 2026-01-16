/* eslint-disable no-undef */

// Import commands
import './commands';

// Suppress uncaught exceptions that may occur during Web3 interactions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test on Web3-related errors
  // that don't affect the actual test flow
  if (err.message.includes('MetaMask') || 
      err.message.includes('ethereum') || 
      err.message.includes('wallet') ||
      err.message.includes('Web3') ||
      err.message.includes('wagmi') ||
      err.message.includes('viem')) {
    return false;
  }
  // Return true to fail on other errors
  return true;
});

// Global before hook for token tests
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage();
  
  // Setup default mocks for Web3 if in test mode
  if (Cypress.env('MOCK_WEB3') !== false) {
    cy.mockWeb3Provider();
  }
  
  // Intercept token-related API calls
  cy.interceptTokenAPI();
});
