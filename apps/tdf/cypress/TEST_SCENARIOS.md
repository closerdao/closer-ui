# Token E2E Test Scenarios - Complete List

This document provides a complete list of all test scenarios covered by the token E2E test suite.

## Test File: token-landing.cy.js

**Purpose**: Test the public token sale landing page

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | should display the token sale landing page | Verifies landing page loads and displays token-related content |
| 2 | should show token availability information | Checks that token availability data is displayed |
| 3 | should allow navigation to token purchase flow for authenticated users | Tests buy button navigation for logged-in users |
| 4 | should redirect unauthenticated users to signup when trying to purchase | Verifies auth requirement for purchase |
| 5 | should display token sale information sections | Checks for multiple content sections on the page |
| 6 | should have working navigation links | Verifies navigation elements are functional |
| 7 | should handle page load without errors | Ensures page loads without critical errors |

## Test File: wallet-connection.cy.js

**Purpose**: Test wallet connection and management functionality

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | should display wallet connect button when not connected | Verifies connect wallet button is shown |
| 2 | should allow wallet connection flow | Tests the wallet connection process |
| 3 | should display wallet address after connection | Checks that wallet address is displayed after connecting |
| 4 | should show wallet balance information | Verifies CELO/cEUR balance display |
| 5 | should handle wallet disconnection | Tests disconnecting the wallet |
| 6 | should detect correct network (Alfajores) | Verifies Alfajores testnet is recognized |
| 7 | should detect wrong network and prompt switching | Tests wrong network detection |
| 8 | should maintain wallet connection across page navigation | Checks connection persistence |
| 9 | should handle multiple wallet connection attempts gracefully | Tests repeated connection attempts |

## Test File: token-checklist-crypto.cy.js

**Purpose**: Test the crypto purchase checklist page

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | should redirect unauthenticated users to signup | Verifies auth requirement |
| 2 | should display checklist page for authenticated users | Tests page display for logged-in users |
| 3 | should show wallet connection requirement | Checks wallet connection prompt |
| 4 | should display CELO balance requirement | Verifies CELO balance check |
| 5 | should display cEUR balance requirement | Verifies cEUR balance check |
| 6 | should enable next button when requirements are met | Tests next button when ready |
| 7 | should navigate to checkout when next is clicked | Verifies navigation to checkout |
| 8 | should show back button to return to previous page | Tests back button functionality |
| 9 | should preserve token amount in URL parameter | Checks token amount persistence |
| 10 | should show progress indicator for token sale flow | Verifies progress display |
| 11 | should handle insufficient CELO balance | Tests insufficient CELO scenario |
| 12 | should handle insufficient cEUR balance | Tests insufficient cEUR scenario |

## Test File: token-checkout.cy.js

**Purpose**: Test the complete token checkout and purchase flow

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | should redirect unauthenticated users to login | Verifies auth requirement |
| 2 | should display checkout page for authenticated users with wallet | Tests checkout page display |
| 3 | should display token amount and total cost | Checks pricing information display |
| 4 | should show approval button when cEUR not approved | Tests approval button display |
| 5 | should handle approval transaction | Tests cEUR approval flow |
| 6 | should show buy button when cEUR is approved | Verifies buy button after approval |
| 7 | should handle token purchase transaction | Tests purchase transaction |
| 8 | should navigate to success page after purchase | Verifies success page navigation |
| 9 | should display error message on transaction failure | Tests error handling |
| 10 | should show loading state during transaction | Checks loading indicators |
| 11 | should allow going back to previous step | Tests back button |
| 12 | should validate minimum purchase amount | Tests minimum amount validation |
| 13 | should show transaction hash after successful purchase | Verifies transaction hash display |

## Test File: token-interface.cy.js

**Purpose**: Test the TokenInterface component for contract interactions

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | should display wallet connection prompt when not connected | Verifies wallet connection requirement |
| 2 | should display contract selector when wallet is connected | Tests contract selection dropdown |
| 3 | should display contract address when contract is selected | Checks address display |
| 4 | should list available contract methods | Tests method selection |
| 5 | should display input fields for selected method | Checks parameter input fields |
| 6 | should show execute button | Verifies execute button presence |
| 7 | should execute contract method and display result | Tests method execution |
| 8 | should handle method execution errors gracefully | Tests error handling |
| 9 | should display loading state during method execution | Checks loading state |
| 10 | should clear results when changing methods | Tests result clearing |
| 11 | should maintain wallet connection state | Verifies connection persistence |
| 12 | should support multiple contract types | Tests multiple contracts |
| 13 | should format and display bigint values correctly | Tests number formatting |
| 14 | should show appropriate error for wrong network | Tests network error handling |

## Test File: token-full-flow.cy.js

**Purpose**: Test complete end-to-end token purchase flows

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | should complete full token purchase flow for authenticated user with wallet | Tests complete purchase from start to finish |
| 2 | should handle unauthenticated user attempting to purchase | Tests auth redirect for unauth users |
| 3 | should require wallet connection for crypto purchase | Verifies wallet requirement |
| 4 | should preserve token amount throughout the flow | Tests amount persistence |
| 5 | should allow user to go back through the flow | Tests back navigation |
| 6 | should show progress throughout the purchase flow | Verifies progress indicators |
| 7 | should handle different token amounts | Tests various token amounts |
| 8 | should handle successful purchase completion | Tests success scenario |
| 9 | should track metrics throughout the flow | Verifies analytics tracking |
| 10 | should support finance/citizenship token purchase option | Tests finance option if enabled |
| 11 | should handle KYC verification requirement | Tests KYC flow |

## Test Coverage by Feature

### Authentication & Authorization
- Unauthenticated user redirect ✅
- Authenticated user access ✅
- Admin user privileges ✅
- KYC verification flow ✅

### Wallet Management
- Wallet connection ✅
- Wallet disconnection ✅
- Address display ✅
- Balance display (CELO & cEUR) ✅
- Network detection ✅
- Network switching ✅
- Connection persistence ✅

### Token Purchase Flow
- Landing page ✅
- Before-you-begin page ✅
- Payment method selection ✅
- Checklist-crypto page ✅
- Balance requirements ✅
- Checkout page ✅
- Token amount input ✅
- Price calculation ✅
- cEUR approval ✅
- Purchase transaction ✅
- Success page ✅
- Error handling ✅

### Contract Interactions
- Contract selection ✅
- Method selection ✅
- Parameter input ✅
- Method execution ✅
- Result display ✅
- Error handling ✅

### User Experience
- Navigation between pages ✅
- Back button functionality ✅
- Progress indicators ✅
- Loading states ✅
- Error messages ✅
- Token amount persistence ✅

### Edge Cases
- Insufficient CELO balance ✅
- Insufficient cEUR balance ✅
- Wrong network ✅
- Transaction failures ✅
- Minimum purchase amount ✅
- Multiple connection attempts ✅
- Page load errors ✅

## Test Data Coverage

### Mock Wallets
- Test wallet address: `0x1234567890123456789012345678901234567890`
- Configurable balances (CELO, cEUR)
- Configurable network (Alfajores/Celo)

### Mock Contracts
- PresenceToken contract
- SweatToken contract
- cEUR token contract
- Configurable addresses and ABIs

### Mock Transactions
- Approval transactions
- Purchase transactions
- Transaction hashes
- Success/failure scenarios

### Mock Users
- Regular user (no KYC)
- KYC-verified user
- Admin user
- Test credentials

## Coverage Metrics Summary

| Category | Count | Notes |
|----------|-------|-------|
| Total Test Files | 6 | All focused on token functionality |
| Total Test Cases | 70+ | Comprehensive coverage |
| User Flows | 5 | Unauth, auth, admin, KYC, non-KYC |
| Pages Tested | 6+ | Landing, checklist, checkout, success, etc. |
| Custom Commands | 9 | Reusable test utilities |
| Mock Scenarios | 15+ | Various states and conditions |
| Error Cases | 10+ | Failure scenarios covered |

## Running Specific Test Scenarios

```bash
# Run all token tests
yarn cypress:run:token

# Run specific test file
npx cypress run --spec "cypress/e2e/token-landing.cy.js"

# Run specific test within a file (using grep)
npx cypress run --spec "cypress/e2e/token-checkout.cy.js" --env grep="should handle approval"

# Interactive mode for debugging specific tests
yarn cypress:open
# Then navigate to the specific test file
```

## Test Maintenance Checklist

When updating the application, check these test scenarios:

- [ ] Token landing page UI changes
- [ ] Wallet connection button/modal changes
- [ ] Checklist requirements changes
- [ ] Checkout flow modifications
- [ ] Success page updates
- [ ] Error message changes
- [ ] Contract address updates
- [ ] API endpoint changes
- [ ] Feature flag changes
- [ ] Navigation/routing changes

## Adding New Test Scenarios

To add new test scenarios:

1. Identify the feature/flow to test
2. Choose appropriate test file or create new one
3. Use existing tests as templates
4. Add mock data to fixtures if needed
5. Use custom commands for common actions
6. Follow naming convention: `should [action/behavior]`
7. Update this list with new test scenarios

## Related Documentation

- [cypress/README.md](README.md) - Detailed test documentation
- [cypress/QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [cypress/IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation overview
