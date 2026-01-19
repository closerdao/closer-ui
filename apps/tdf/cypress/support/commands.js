/* eslint-disable no-undef */

/**
 * Custom Cypress commands for token and wallet testing
 */

// Mock wallet connection
Cypress.Commands.add('mockWalletConnect', (address = '0x1234567890123456789012345678901234567890') => {
  cy.window().then((win) => {
    // Mock wallet state
    win.localStorage.setItem('walletConnected', 'true');
    win.localStorage.setItem('walletAddress', address);
  });
});

// Mock wallet disconnect
Cypress.Commands.add('mockWalletDisconnect', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('walletConnected');
    win.localStorage.removeItem('walletAddress');
  });
});

// Mock Web3 Provider
Cypress.Commands.add('mockWeb3Provider', (options = {}) => {
  const {
    chainId = 44787, // Alfajores testnet
    accounts = ['0x1234567890123456789012345678901234567890'],
    balances = {
      celo: '1000000000000000000', // 1 CELO
      ceur: '1000000000000000000000', // 1000 cEUR
    },
  } = options;

  cy.window().then((win) => {
    // Mock ethereum provider
    win.ethereum = {
      isMetaMask: true,
      selectedAddress: accounts[0],
      chainId: `0x${chainId.toString(16)}`,
      networkVersion: chainId.toString(),
      
      request: cy.stub().callsFake(({ method, params }) => {
        switch (method) {
          case 'eth_requestAccounts':
            return Promise.resolve(accounts);
          case 'eth_accounts':
            return Promise.resolve(accounts);
          case 'eth_chainId':
            return Promise.resolve(`0x${chainId.toString(16)}`);
          case 'wallet_switchEthereumChain':
            return Promise.resolve(null);
          case 'eth_getBalance':
            return Promise.resolve(balances.celo);
          default:
            return Promise.resolve(null);
        }
      }),
      
      on: cy.stub(),
      removeListener: cy.stub(),
    };

    // Mock wagmi/viem if needed
    if (!win.mockWeb3Initialized) {
      win.mockWeb3Initialized = true;
    }
  });
});

// Mock contract read calls
Cypress.Commands.add('mockContractRead', (contractAddress, method, returnValue) => {
  cy.window().then((win) => {
    if (!win.contractReadMocks) {
      win.contractReadMocks = {};
    }
    const key = `${contractAddress}_${method}`;
    win.contractReadMocks[key] = returnValue;
  });
});

// Mock contract write calls
Cypress.Commands.add('mockContractWrite', (contractAddress, method, options = {}) => {
  const { success = true, transactionHash = '0xabc123def456' } = options;
  
  cy.window().then((win) => {
    if (!win.contractWriteMocks) {
      win.contractWriteMocks = {};
    }
    const key = `${contractAddress}_${method}`;
    win.contractWriteMocks[key] = { success, transactionHash };
  });
});

// Login helper specifically for token tests
Cypress.Commands.add('loginForTokenTests', (userType = 'admin') => {
  const email = userType === 'admin' 
    ? Cypress.env('TEST_ADMIN_EMAIL') 
    : Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');

  cy.visit(`${Cypress.config('baseUrl')}/login`);
  cy.get('input[aria-label*="Email"]').type(email);
  cy.get('input[aria-label*="Password"]').type(password);
  cy.contains('button', 'Log in').click();
  cy.wait(2000);
});

// Wait for wallet to be ready
Cypress.Commands.add('waitForWallet', (timeout = 5000) => {
  cy.window({ timeout }).should((win) => {
    expect(win.ethereum).to.exist;
  });
});

// Intercept API calls related to tokens
Cypress.Commands.add('interceptTokenAPI', () => {
  // Mock token metrics
  cy.intercept('POST', '**/api/metric', {
    statusCode: 200,
    body: { success: true },
  }).as('metric');

  // Mock token availability
  cy.intercept('GET', '**/api/token/available', {
    statusCode: 200,
    body: { available: 10000, sold: 5000 },
  }).as('tokenAvailable');

  // Mock token purchase
  cy.intercept('POST', '**/api/token/purchase', {
    statusCode: 200,
    body: { 
      success: true, 
      transactionHash: '0xabc123def456',
      tokenAmount: 100,
    },
  }).as('tokenPurchase');
});

// Check if feature flag is enabled
Cypress.Commands.add('skipIfFeatureDisabled', (featureName) => {
  cy.window().then((win) => {
    const isEnabled = win.localStorage.getItem(featureName) === 'true' ||
                     process.env[featureName] === 'true';
    if (!isEnabled) {
      cy.log(`Feature ${featureName} is disabled, skipping test`);
      // Skip test dynamically
      cy.state('runnable').skip();
    }
  });
});
