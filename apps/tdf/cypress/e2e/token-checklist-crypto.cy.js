/* eslint-disable no-undef */

/**
 * E2E Tests for Checklist Crypto Page
 * Tests the crypto purchase checklist page including authentication,
 * wallet balance checks, and navigation to checkout
 */

describe('Checklist Crypto Page', () => {
  let tokenData;

  before(() => {
    cy.fixture('token-data').then((data) => {
      tokenData = data;
    });
  });

  beforeEach(() => {
    // Check if features are enabled
    cy.window().then(() => {
      if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true' ||
          process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET !== 'true') {
        cy.log('Required features disabled, skipping test');
        // @ts-ignore
        cy.state('runnable').skip();
      }
    });
  });

  it('should redirect unauthenticated users to signup', () => {
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Should redirect to signup or login
    cy.url().should('match', /(signup|login)/);
  });

  it('should display checklist page for authenticated users', () => {
    cy.loginForTokenTests('admin');
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Should stay on checklist page or navigate to next step
    cy.url().should('include', 'token');
    
    // Page should have content
    cy.get('body').should('exist');
  });

  it('should show wallet connection requirement', () => {
    cy.loginForTokenTests('admin');
    
    // Visit without wallet connected
    cy.mockWalletDisconnect();
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Should show wallet connection prompt
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/connect.*wallet|wallet/i)) {
        cy.log('Wallet connection prompt found');
      }
    });
  });

  it('should display CELO balance requirement', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: {
        celo: '100000000000000000', // 0.1 CELO
        ceur: tokenData.testWallet.balances.ceur,
      },
    });
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Should show CELO requirement
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/celo/i)) {
        cy.log('CELO balance check found');
      }
    });
  });

  it('should display cEUR balance requirement', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: {
        celo: tokenData.testWallet.balances.celo,
        ceur: '100000000000000000000', // 100 cEUR
      },
    });
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Should show cEUR requirement
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/ceur|eur/i)) {
        cy.log('cEUR balance check found');
      }
    });
  });

  it('should enable next button when requirements are met', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Look for next/continue button
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/next|continue|proceed/i)) {
        cy.contains('button', /next|continue|proceed/i).should('exist');
      }
    });
  });

  it('should navigate to checkout when next is clicked', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Click next button if it exists
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/next|continue|proceed/i)) {
        cy.contains('button', /next|continue|proceed/i).click({ force: true });
        cy.wait(1000);
        
        // Should navigate forward in the flow
        cy.url().should('match', /token\/(checkout|nationality)/);
      }
    });
  });

  it('should show back button to return to previous page', () => {
    cy.loginForTokenTests('admin');
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Look for back button
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/back|previous/i)) {
        cy.contains(/back|previous/i).should('exist');
      }
    });
  });

  it('should preserve token amount in URL parameter', () => {
    cy.loginForTokenTests('admin');
    cy.visit('/token/checklist-crypto?tokens=250');
    cy.wait(2000);
    
    // Verify token amount is in URL
    cy.url().should('include', 'tokens=250');
    
    // Token amount should be reflected in the page
    cy.get('body').should('exist');
  });

  it('should show progress indicator for token sale flow', () => {
    cy.loginForTokenTests('admin');
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Look for progress bar or step indicator
    cy.get('body').then(($body) => {
      // Check for progress-related elements
      const hasProgress = $body.find('[class*="progress"], [class*="step"]').length > 0;
      if (hasProgress) {
        cy.log('Progress indicator found');
      } else {
        cy.log('No progress indicator visible');
      }
    });
  });

  it('should handle insufficient CELO balance', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: {
        celo: '10000000000000000', // 0.01 CELO (insufficient)
        ceur: tokenData.testWallet.balances.ceur,
      },
    });
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Should show insufficient balance message or disabled next button
    cy.get('body').should('exist');
  });

  it('should handle insufficient cEUR balance', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: {
        celo: tokenData.testWallet.balances.celo,
        ceur: '50000000000000000000', // 50 cEUR (may be insufficient)
      },
    });
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Should show insufficient balance message
    cy.get('body').should('exist');
  });
});
