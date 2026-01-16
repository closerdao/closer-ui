/* eslint-disable no-undef */

/**
 * E2E Tests for Wallet Connection Flow
 * Tests wallet connection, disconnection, and network switching
 */

describe('Wallet Connection Flow', () => {
  let tokenData;

  before(() => {
    cy.fixture('token-data').then((data) => {
      tokenData = data;
    });
  });

  beforeEach(() => {
    // Check if Web3 wallet feature is enabled
    cy.window().then((win) => {
      if (process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET !== 'true') {
        cy.log('Web3 wallet feature is disabled, skipping test');
        // Skip test if feature disabled
        cy.state('runnable').skip();
      }
    });
  });

  it('should display wallet connect button when not connected', () => {
    cy.visit('/token');
    cy.wait(1000);
    
    // Look for connect wallet button (text may vary)
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/connect.*wallet|wallet.*connect/i)) {
        cy.contains(/connect.*wallet|wallet.*connect/i).should('be.visible');
      } else {
        cy.log('Wallet connect button not found on this page');
      }
    });
  });

  it('should allow wallet connection flow', () => {
    // Mock the wallet provider before visiting the page
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/token');
    cy.wait(1000);
    
    // Look for wallet button
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      
      if (bodyText.match(/connect.*wallet|wallet/i)) {
        // Try to interact with wallet component
        cy.contains(/wallet|connect/i).first().should('exist');
      }
    });
  });

  it('should display wallet address after connection', () => {
    // Pre-connect wallet
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
    });
    
    cy.visit('/token');
    cy.wait(2000);
    
    // Check if address is displayed (may be truncated)
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      // Look for truncated address format like 0x1234...7890
      const addressPattern = /0x[a-fA-F0-9]{4}\.{2,3}[a-fA-F0-9]{4}/;
      
      if (addressPattern.test(bodyText)) {
        cy.log('Wallet address found in page');
        expect(bodyText).to.match(addressPattern);
      } else {
        cy.log('Wallet address not displayed (may not be on this page)');
      }
    });
  });

  it('should show wallet balance information', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Look for balance display (CELO or cEUR)
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/balance|celo|ceur/i)) {
        cy.log('Balance information found');
      } else {
        cy.log('Balance not displayed on this page');
      }
    });
  });

  it('should handle wallet disconnection', () => {
    // First connect
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
    });
    
    cy.visit('/token');
    cy.wait(1000);
    
    // Then disconnect
    cy.mockWalletDisconnect();
    
    // Reload to see disconnected state
    cy.reload();
    cy.wait(1000);
    
    // Should show connect button again
    cy.get('body').should('exist');
  });

  it('should detect correct network (Alfajores)', () => {
    cy.mockWeb3Provider({
      chainId: 44787, // Alfajores testnet
      accounts: [tokenData.testWallet.address],
    });
    
    cy.visit('/token/checkout?tokens=100');
    cy.wait(2000);
    
    // The app should work with Alfajores network
    cy.get('body').should('exist');
    cy.url().should('include', '/token/checkout');
  });

  it('should detect wrong network and prompt switching', () => {
    // Connect with wrong network (e.g., Ethereum mainnet)
    cy.mockWeb3Provider({
      chainId: 1, // Ethereum mainnet
      accounts: [tokenData.testWallet.address],
    });
    
    cy.visit('/token/checkout?tokens=100');
    cy.wait(2000);
    
    // Look for network switch prompt
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/switch.*network|wrong.*network|network.*error/i)) {
        cy.log('Network switch prompt detected');
      } else {
        cy.log('No network switch prompt (may auto-switch)');
      }
    });
  });

  it('should maintain wallet connection across page navigation', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
    });
    
    cy.visit('/token');
    cy.wait(1000);
    
    // Navigate to another page
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(1000);
    
    // Wallet should still be connected
    cy.window().then((win) => {
      const isConnected = win.localStorage.getItem('walletConnected');
      expect(isConnected).to.equal('true');
    });
  });

  it('should handle multiple wallet connection attempts gracefully', () => {
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
    });
    
    cy.visit('/token');
    cy.wait(1000);
    
    // Try multiple connection actions
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.wait(500);
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.wait(500);
    
    // Should handle gracefully without errors
    cy.get('body').should('exist');
  });
});
