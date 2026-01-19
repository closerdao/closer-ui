# Token E2E Test Suite

This directory contains comprehensive E2E tests for the TDF token functionality, covering the complete token purchase flow including wallet connection, token checkout, and purchase transactions.

## Test Coverage

### Test Files

1. **token-landing.cy.js** - Token sale landing page tests
   - Token availability display
   - Navigation to purchase flow
   - Authentication requirements

2. **wallet-connection.cy.js** - Wallet connection flow tests
   - Wallet connect/disconnect
   - Network detection and switching
   - Balance display
   - Connection persistence

3. **token-checklist-crypto.cy.js** - Crypto purchase checklist tests
   - Authentication requirements
   - Wallet balance checks (CELO and cEUR)
   - Navigation to checkout
   - Insufficient balance handling

4. **token-checkout.cy.js** - Token checkout and purchase tests
   - Token amount and cost display
   - cEUR approval flow
   - Token purchase transactions
   - Success/error handling
   - Transaction hash display

5. **token-interface.cy.js** - TokenInterface component tests
   - Contract selection
   - Method execution
   - Result display
   - Error handling

6. **token-full-flow.cy.js** - Complete integration tests
   - End-to-end purchase flow
   - User authentication flow
   - Token amount preservation
   - Progress tracking
   - Multiple scenarios

## Setup

### Prerequisites

1. Node.js and Yarn installed
2. TDF app dependencies installed (`yarn install`)
3. Environment variables configured (see `.env.sample`)

### Environment Variables

Required environment variables for token tests (in `.env` file):

```bash
# Feature Flags
NEXT_PUBLIC_FEATURE_TOKEN_SALE=true
NEXT_PUBLIC_FEATURE_WEB3_WALLET=true

# Network Configuration
NEXT_PUBLIC_NETWORK=alfajores

# Test Accounts
TEST_ADMIN_EMAIL=admin@example.com
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=your_test_password

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### Test Data

Test fixtures are stored in `cypress/fixtures/`:
- `token-data.json` - Mock data for wallets, contracts, and transactions

## Running Tests

### Interactive Mode

Open Cypress interactive test runner:

```bash
# From repository root
yarn cypress:open

# Or from TDF app directory
cd apps/tdf
npx cypress open
```

Then select "E2E Testing" and choose a browser to run tests interactively.

### Headless Mode

Run all tests in headless mode:

```bash
# From TDF app directory
cd apps/tdf
npx cypress run
```

Run specific test file:

```bash
npx cypress run --spec "cypress/e2e/token-landing.cy.js"
```

### CI Mode

Tests are configured to run in CI with the following settings:
- Web3 mocking enabled
- Video recording disabled
- Screenshots on failure enabled

## Test Structure

### Support Files

- `cypress/support/commands.js` - Custom Cypress commands for token tests
- `cypress/support/e2e.js` - Global test configuration and hooks

### Custom Commands

Available custom commands for token testing:

```javascript
// Wallet mocking
cy.mockWalletConnect(address)
cy.mockWalletDisconnect()
cy.mockWeb3Provider(options)

// Contract interactions
cy.mockContractRead(contractAddress, method, returnValue)
cy.mockContractWrite(contractAddress, method, options)

// Authentication
cy.loginForTokenTests(userType)

// API mocking
cy.interceptTokenAPI()

// Utilities
cy.waitForWallet(timeout)
cy.skipIfFeatureDisabled(featureName)
```

## Mocking Strategy

### Web3 Provider

Tests use mocked Web3 providers to simulate wallet connections without requiring actual wallet extensions:

- Mock Ethereum provider with configurable chainId, accounts, and balances
- Stub contract read/write operations
- Simulate transaction responses

### API Endpoints

Token-related API endpoints are intercepted and mocked:

- Token availability endpoints
- Purchase endpoints
- Metric tracking endpoints

### Blockchain Interactions

Smart contract interactions are mocked using:
- Contract read method stubs
- Contract write method stubs with transaction hashes
- Balance queries

## Best Practices

1. **Feature Flags** - Tests check feature flags and skip if features are disabled
2. **Test Isolation** - Each test is independent and doesn't rely on others
3. **Mock Data** - All Web3 interactions use mocks to avoid dependencies on external services
4. **Flexible Selectors** - Tests use flexible text-based selectors that adapt to UI changes
5. **Error Handling** - Tests handle expected Web3 errors gracefully

## Troubleshooting

### Tests Skipping

If tests are being skipped, check:
1. Feature flags are enabled in environment variables
2. `NEXT_PUBLIC_FEATURE_TOKEN_SALE=true`
3. `NEXT_PUBLIC_FEATURE_WEB3_WALLET=true`

### Wallet Connection Issues

Tests mock wallet connections. If you see wallet-related errors:
1. Ensure `MOCK_WEB3=true` in Cypress env
2. Check that support files are loaded
3. Verify `cy.mockWeb3Provider()` is called in test setup

### Timing Issues

Some tests include wait times for page loads and transitions. Adjust waits if tests are flaky:
```javascript
cy.wait(2000); // Increase if needed
```

### Selector Changes

If tests fail due to UI changes, update selectors in test files. Tests use flexible text-based matching where possible.

## Extending Tests

### Adding New Tests

1. Create new test file in `cypress/e2e/` following naming convention: `token-*.cy.js`
2. Import fixtures: `cy.fixture('token-data')`
3. Use custom commands from support files
4. Follow existing test patterns

### Adding Mock Data

Update `cypress/fixtures/token-data.json` with new test data:

```json
{
  "testWallet": { ... },
  "contracts": { ... },
  "tokenSale": { ... }
}
```

### Adding Custom Commands

Add new commands to `cypress/support/commands.js`:

```javascript
Cypress.Commands.add('myCustomCommand', (params) => {
  // Implementation
});
```

## CI Integration

### GitHub Actions

Tests can be integrated into CI pipeline:

```yaml
- name: Run Cypress Tests
  run: |
    cd apps/tdf
    npx cypress run --spec "cypress/e2e/token-*.cy.js"
  env:
    NEXT_PUBLIC_FEATURE_TOKEN_SALE: true
    NEXT_PUBLIC_FEATURE_WEB3_WALLET: true
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### Dependencies

Tests assume the TDF app is running on `http://localhost:3000`. In CI:
1. Start the app before running tests
2. Wait for app to be ready
3. Run Cypress tests
4. Stop the app

## Related Documentation

- [Cypress Documentation](https://docs.cypress.io/)
- [TDF Token Sale Flow](../../pages/token/README.md) (if exists)
- [Wallet Integration](../../components/Wallet.tsx)
- [Token Hooks](../../hooks/usePresenceToken.ts)

## Support

For issues or questions about token tests:
1. Check existing test files for examples
2. Review custom commands in support files
3. Consult Cypress documentation
4. Check console logs for detailed error messages
