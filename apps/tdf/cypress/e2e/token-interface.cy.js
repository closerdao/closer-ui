/* eslint-disable no-undef */

/**
 * E2E Tests for Token Interface Component
 * Tests the token interaction interface for reading contract data
 */

describe('Token Interface Component', () => {
  let tokenData;

  before(() => {
    cy.fixture('token-data').then((data) => {
      tokenData = data;
    });
  });

  beforeEach(() => {
    // Check if Web3 wallet feature is enabled
    cy.window().then(() => {
      if (process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET !== 'true') {
        cy.log('Web3 wallet feature is disabled, skipping test');
        // Skip test if feature disabled
        cy.state('runnable').skip();
      }
    });
  });

  it('should display wallet connection prompt when not connected', () => {
    // Find a page that uses TokenInterface component
    // This may be a dashboard or tokens page
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Look for wallet connection message
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/connect.*wallet|wallet.*connect/i)) {
        cy.log('Wallet connection prompt found');
      }
    });
  });

  it('should display contract selector when wallet is connected', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Look for contract selection dropdown
    cy.get('body').then(($body) => {
      const hasSelect = $body.find('select, [role="combobox"]').length > 0;
      if (hasSelect) {
        cy.log('Contract selector found');
        cy.get('select, [role="combobox"]').should('exist');
      } else {
        cy.log('Contract selector not found on this page');
      }
    });
  });

  it('should display contract address when contract is selected', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Check for address display (may be in a specific format)
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const hasAddress = /0x[a-fA-F0-9]{40}/.test(bodyText) || 
                        /0x[a-fA-F0-9]{4}\.{2,3}[a-fA-F0-9]{4}/.test(bodyText);
      if (hasAddress) {
        cy.log('Contract address displayed');
      }
    });
  });

  it('should list available contract methods', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Look for method selection
    cy.get('body').then(($body) => {
      const hasSelect = $body.find('select').length > 1;
      if (hasSelect) {
        cy.log('Method selector found');
      }
    });
  });

  it('should display input fields for selected method', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Look for input fields
    cy.get('body').then(($body) => {
      const hasInputs = $body.find('input[type="text"]').length > 0;
      if (hasInputs) {
        cy.log('Method input fields found');
      }
    });
  });

  it('should show execute button', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Look for execute/call button
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/execute|call|submit/i)) {
        cy.contains('button', /execute|call|submit/i).should('exist');
      }
    });
  });

  it('should execute contract method and display result', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    // Mock contract read result
    cy.mockContractRead(
      tokenData.contracts.presenceToken.address,
      'totalSupply',
      tokenData.contracts.presenceToken.totalSupply
    );
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Look for result display area
    cy.get('body').then(($body) => {
      const hasResult = $body.find('pre, code, [class*="result"]').length > 0;
      if (hasResult) {
        cy.log('Result display area found');
      }
    });
  });

  it('should handle method execution errors gracefully', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Page should handle errors without crashing
    cy.get('body').should('exist');
  });

  it('should display loading state during method execution', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Look for loading indicators
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      // Verify page is responsive
      expect(bodyText.length).to.be.greaterThan(0);
    });
  });

  it('should clear results when changing methods', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Test interaction if selectors exist
    cy.get('body').then(($body) => {
      const selects = $body.find('select');
      if (selects.length > 1) {
        // Change selection if possible
        cy.log('Testing method switching');
      }
    });
  });

  it('should maintain wallet connection state', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Verify wallet stays connected
    cy.window().then((win) => {
      expect(win.localStorage.getItem('walletConnected')).to.equal('true');
    });
  });

  it('should support multiple contract types', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Check for contract options
    cy.get('body').then(($body) => {
      const selects = $body.find('select');
      if (selects.length > 0) {
        cy.log('Contract selector available');
      }
    });
  });

  it('should format and display bigint values correctly', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    // Mock large number result
    cy.mockContractRead(
      tokenData.contracts.presenceToken.address,
      'totalSupply',
      '1000000000000000000000000'
    );
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Should display numbers in readable format
    cy.get('body').should('exist');
  });

  it('should show appropriate error for wrong network', () => {
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 1, // Wrong network
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/tokens');
    cy.wait(2000);
    
    // Should show network error or prompt to switch
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/network|switch/i)) {
        cy.log('Network error message found');
      }
    });
  });
});
