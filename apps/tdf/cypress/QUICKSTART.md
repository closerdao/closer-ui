# Token E2E Tests - Quick Start Guide

This guide will help you quickly set up and run the token E2E tests.

## Prerequisites

1. **Node.js 18+** and **Yarn** installed
2. **Repository cloned** and dependencies installed:
   ```bash
   git clone https://github.com/closerdao/closer-ui.git
   cd closer-ui
   yarn install
   ```

## Quick Setup (5 minutes)

### 1. Configure Environment

Create a `.env` file in `apps/tdf/`:

```bash
cd apps/tdf
cp .env.sample .env
```

Edit `.env` and ensure these values are set:

```bash
# Feature Flags (REQUIRED for token tests)
NEXT_PUBLIC_FEATURE_TOKEN_SALE=true
NEXT_PUBLIC_FEATURE_WEB3_WALLET=true

# Network (use alfajores for testing)
NEXT_PUBLIC_NETWORK=alfajores

# Test Accounts (REQUIRED)
TEST_ADMIN_EMAIL=admin@example.com
TEST_USER_EMAIL=user@example.com  
TEST_USER_PASSWORD=your_password_here

# WalletConnect Project ID (optional for mocked tests)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### 2. Run Tests Interactively

**Option A: Open Cypress UI (Recommended for development)**

```bash
# From apps/tdf directory
yarn cypress:open
```

Then:
1. Click "E2E Testing"
2. Choose a browser (Chrome recommended)
3. Click on any test file to run it

**Option B: Run all token tests in terminal**

```bash
# From apps/tdf directory
yarn cypress:run:token
```

**Option C: Run specific test file**

```bash
npx cypress run --spec "cypress/e2e/token-landing.cy.js"
```

### 3. Run with App Server

If tests need the app running:

```bash
# Terminal 1: Start the app
yarn dev

# Terminal 2: Run tests
yarn cypress:open
# or
yarn cypress:run:token
```

## Test Files Overview

| File | Purpose | Key Tests |
|------|---------|-----------|
| `token-landing.cy.js` | Landing page | Token display, navigation |
| `wallet-connection.cy.js` | Wallet flow | Connect, disconnect, network |
| `token-checklist-crypto.cy.js` | Pre-checkout | Auth, balances, requirements |
| `token-checkout.cy.js` | Purchase | Approval, transaction, success |
| `token-interface.cy.js` | Token UI | Contract interaction |
| `token-full-flow.cy.js` | End-to-end | Complete purchase flow |

## Common Commands

```bash
# Open interactive UI
yarn cypress:open

# Run all token tests (headless)
yarn cypress:run:token

# Run specific test
npx cypress run --spec "cypress/e2e/token-landing.cy.js"

# Run with specific browser
npx cypress run --browser chrome

# Run tests with app auto-start (requires start-server-and-test)
yarn test:e2e
```

## Troubleshooting

### Tests are skipping

**Problem**: Tests show as "skipped" or "pending"

**Solution**: Check feature flags in `.env`:
```bash
NEXT_PUBLIC_FEATURE_TOKEN_SALE=true
NEXT_PUBLIC_FEATURE_WEB3_WALLET=true
```

### Can't find test files

**Problem**: Cypress doesn't see test files

**Solution**: Make sure you're in the correct directory:
```bash
cd apps/tdf
yarn cypress:open
```

### Tests fail with "Cannot find module"

**Problem**: Missing dependencies

**Solution**: Install dependencies:
```bash
cd ../../  # Back to root
yarn install
cd apps/tdf
```

### Network errors in tests

**Problem**: Tests fail with network/API errors

**Solution**: Tests use mocks, but verify:
1. Web3 mocking is enabled (should be automatic)
2. API interceptors are working (check support files)

### Authentication fails

**Problem**: Login tests fail

**Solution**: 
1. Verify test credentials in `.env`
2. Ensure the API is accessible (or properly mocked)
3. Check if user accounts exist in test environment

## Writing New Tests

### Basic Test Template

```javascript
/* eslint-disable no-undef */

describe('My Token Feature', () => {
  let tokenData;

  before(() => {
    cy.fixture('token-data').then((data) => {
      tokenData = data;
    });
  });

  beforeEach(() => {
    // Setup mocks
    cy.mockWeb3Provider({
      chainId: 44787,
      accounts: [tokenData.testWallet.address],
      balances: tokenData.testWallet.balances,
    });
  });

  it('should do something', () => {
    cy.visit('/token');
    cy.wait(1000);
    
    // Your test assertions
    cy.get('body').should('exist');
  });
});
```

### Using Custom Commands

```javascript
// Mock wallet connection
cy.mockWalletConnect('0xYourAddress');

// Login as admin
cy.loginForTokenTests('admin');

// Mock contract read
cy.mockContractRead('0xContract', 'balanceOf', '1000000');

// Intercept API calls
cy.interceptTokenAPI();
```

## Next Steps

1. **Run existing tests** to verify setup
2. **Explore test files** in `cypress/e2e/`
3. **Check README** in `cypress/` for detailed documentation
4. **Add new tests** as features are developed

## Getting Help

- Check `cypress/README.md` for detailed documentation
- Review existing tests for examples
- Check Cypress docs: https://docs.cypress.io/
- Look at support files in `cypress/support/` for available commands

## CI Integration

Tests can run in CI. See `.github/workflows/token-e2e.yml.example` for GitHub Actions setup.

Key points for CI:
- Tests run headlessly
- Web3 interactions are mocked
- Screenshots saved on failure
- Videos recorded for debugging

## Performance Tips

- Use `cy.intercept()` to mock API calls
- Keep waits minimal but sufficient
- Run specific test files during development
- Use parallel execution in CI for faster results
