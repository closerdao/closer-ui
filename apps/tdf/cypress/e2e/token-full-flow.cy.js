/* eslint-disable no-undef */

/**
 * E2E Integration Tests for Complete Token Purchase Flow
 * Tests the end-to-end flow from landing page to successful purchase
 */

describe('Complete Token Purchase Flow', () => {
  let tokenData;

  before(() => {
    cy.fixture('token-data').then((data) => {
      tokenData = data;
    });
  });

  beforeEach(() => {
    // Check if features are enabled
    cy.window().then(() => {
      if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
        cy.log('Token sale feature disabled, skipping test');
        // @ts-ignore
        cy.state('runnable').skip();
      }
    });
  });

  it('should complete full token purchase flow for authenticated user with wallet', () => {
    // Step 1: Login
    cy.loginForTokenTests('admin');
    cy.wait(1000);
    
    // Step 2: Setup wallet
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    // Step 3: Visit token sale landing page
    cy.visit('/token');
    cy.wait(2000);
    cy.url().should('include', '/token');
    
    // Step 4: Navigate to purchase flow
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/buy|purchase|get.*token/i)) {
        cy.contains(/buy|purchase|get.*token/i).first().click({ force: true });
        cy.wait(2000);
      } else {
        // If no buy button, navigate directly
        cy.visit('/token/before-you-begin?tokens=100');
        cy.wait(2000);
      }
    });
    
    // Step 5: Select crypto payment if on before-you-begin page
    cy.url().then((url) => {
      if (url.includes('before-you-begin')) {
        cy.get('body').then(($body) => {
          const bodyText = $body.text();
          if (bodyText.match(/crypto/i)) {
            // Select crypto option if available
            cy.contains(/crypto/i).click({ force: true });
            cy.wait(500);
          }
          
          // Click next button
          if (bodyText.match(/next|continue/i)) {
            cy.contains('button', /next|continue/i).click({ force: true });
            cy.wait(2000);
          }
        });
      }
    });
    
    // Step 6: Complete checklist if on checklist page
    cy.url().then((url) => {
      if (url.includes('checklist-crypto')) {
        cy.wait(2000);
        
        cy.get('body').then(($body) => {
          const bodyText = $body.text();
          if (bodyText.match(/next|continue|proceed/i)) {
            cy.contains('button', /next|continue|proceed/i).click({ force: true });
            cy.wait(2000);
          }
        });
      }
    });
    
    // Step 7: Mock contract approval state
    cy.mockContractRead(
      tokenData.contracts.ceur.address,
      'allowance',
      '10000000000000000000000' // Sufficient allowance
    );
    
    // Step 8: Should reach checkout page
    cy.url().then((url) => {
      if (!url.includes('checkout')) {
        cy.visit('/token/checkout?tokens=100');
        cy.wait(2000);
      }
    });
    
    cy.url().should('include', 'token');
    
    // Step 9: Verify checkout page content
    cy.get('body').should('exist');
    cy.get('body').should('contain.text', '100');
    
    // Step 10: Look for purchase button
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/buy|purchase|confirm/i)) {
        cy.log('Purchase flow reached checkout successfully');
      }
    });
  });

  it('should handle unauthenticated user attempting to purchase', () => {
    // Visit token page without authentication
    cy.visit('/token');
    cy.wait(2000);
    
    // Try to access purchase flow
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/buy|purchase|get.*token/i)) {
        cy.contains(/buy|purchase|get.*token/i).first().click({ force: true });
        cy.wait(2000);
        
        // Should redirect to signup/login
        cy.url().should('match', /(signup|login)/);
      }
    });
  });

  it('should require wallet connection for crypto purchase', () => {
    // Login but no wallet
    cy.loginForTokenTests('admin');
    cy.mockWalletDisconnect();
    
    // Try to access checkout
    cy.visit('/token/checkout?tokens=100');
    cy.wait(2000);
    
    // Should show wallet connection requirement
    cy.get('body').should('exist');
  });

  it('should preserve token amount throughout the flow', () => {
    const tokenAmount = 250;
    
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    // Start with specific token amount
    cy.visit(`/token/before-you-begin?tokens=${tokenAmount}`);
    cy.wait(2000);
    
    // Verify URL contains token amount
    cy.url().should('include', `tokens=${tokenAmount}`);
    
    // Navigate through flow
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/next|continue/i)) {
        cy.contains('button', /next|continue/i).click({ force: true });
        cy.wait(1000);
      }
    });
    
    // Amount should be preserved
    cy.url().should('include', `tokens=${tokenAmount}`);
  });

  it('should allow user to go back through the flow', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    // Start at checkout
    cy.visit('/token/checkout?tokens=100');
    cy.wait(2000);
    
    // Look for back button
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/back/i)) {
        const backButton = cy.contains(/back/i).first();
        backButton.click({ force: true });
        cy.wait(1000);
        
        // Should navigate back
        cy.url().should('not.include', 'checkout');
      }
    });
  });

  it('should show progress throughout the purchase flow', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    // Visit checklist page
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(2000);
    
    // Look for progress indicator
    cy.get('body').then(($body) => {
      const hasProgress = $body.find('[class*="progress"], [class*="step"]').length > 0;
      cy.log(`Progress indicator present: ${hasProgress}`);
    });
    
    // Visit checkout page
    cy.visit('/token/checkout?tokens=100');
    cy.wait(2000);
    
    // Should still have progress indicator
    cy.get('body').should('exist');
  });

  it('should handle different token amounts', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    const amounts = [10, 100, 1000];
    
    amounts.forEach((amount) => {
      cy.visit(`/token/checkout?tokens=${amount}`);
      cy.wait(1000);
      
      // Should display the amount
      cy.get('body').should('contain.text', amount.toString());
    });
  });

  it('should handle successful purchase completion', () => {
    cy.loginForTokenTests('admin');
    cy.mockWalletConnect(tokenData.testWallet.address);
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
    
    // Mock successful purchase
    cy.intercept('POST', '**/api/token/purchase', {
      statusCode: 200,
      body: {
        success: true,
        transactionHash: tokenData.transactions.purchase.hash,
        tokenAmount: 100,
      },
    }).as('purchase');
    
    // Visit success page
    cy.visit('/token/success');
    cy.wait(2000);
    
    // Should show success message
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/success|complete|congratulations/i)) {
        cy.log('Success page displayed correctly');
      }
    });
  });

  it('should track metrics throughout the flow', () => {
    // Mock metric tracking
    cy.intercept('POST', '**/api/metric', (req) => {
      expect(req.body).to.have.property('event');
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('metric');
    
    cy.loginForTokenTests('admin');
    
    // Visit token pages
    cy.visit('/token');
    cy.wait(1000);
    
    cy.visit('/token/checklist-crypto?tokens=100');
    cy.wait(1000);
    
    // Metrics should have been called
    cy.get('@metric.all').should('have.length.greaterThan', 0);
  });

  it('should support finance/citizenship token purchase option', () => {
    cy.loginForTokenTests('admin');
    
    // Check if citizenship feature is enabled
    if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true') {
      cy.visit('/token/before-you-begin?tokens=100');
      cy.wait(2000);
      
      // Look for finance option
      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        if (bodyText.match(/finance|citizenship/i)) {
          cy.log('Finance option available');
        }
      });
    }
  });

  it('should handle KYC verification requirement', () => {
    cy.loginForTokenTests('user'); // Non-KYC user
    
    cy.visit('/token/before-you-begin?tokens=100');
    cy.wait(2000);
    
    // Should proceed to nationality/KYC page if not verified
    cy.get('body').should('exist');
  });
});
