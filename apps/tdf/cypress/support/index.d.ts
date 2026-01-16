/// <reference types="cypress" />

/**
 * TypeScript type definitions for custom Cypress commands
 */

declare namespace Cypress {
  interface Chainable {
    /**
     * Mock wallet connection with a specific address
     * @param address - Ethereum address to use for the mock wallet (default: 0x1234567890123456789012345678901234567890)
     * @example
     * cy.mockWalletConnect('0xabcdef1234567890abcdef1234567890abcdef12')
     */
    mockWalletConnect(address?: string): Chainable<void>;

    /**
     * Mock wallet disconnection by clearing wallet state
     * @example
     * cy.mockWalletDisconnect()
     */
    mockWalletDisconnect(): Chainable<void>;

    /**
     * Mock Web3 provider with configurable options
     * @param options - Configuration for the mock Web3 provider
     * @param options.chainId - Chain ID for the network (default: 44787 for Alfajores)
     * @param options.accounts - Array of account addresses (default: ['0x1234567890123456789012345678901234567890'])
     * @param options.balances - Object containing CELO and cEUR balances
     * @example
     * cy.mockWeb3Provider({
     *   chainId: 44787,
     *   accounts: ['0xabc123'],
     *   balances: { celo: '1000000000000000000', ceur: '1000000000000000000000' }
     * })
     */
    mockWeb3Provider(options?: {
      chainId?: number;
      accounts?: string[];
      balances?: {
        celo?: string;
        ceur?: string;
      };
    }): Chainable<void>;

    /**
     * Mock contract read method return value
     * @param contractAddress - Address of the contract
     * @param method - Name of the method to mock
     * @param returnValue - Value to return when the method is called
     * @example
     * cy.mockContractRead('0xContract123', 'totalSupply', '1000000000000000000000')
     */
    mockContractRead(
      contractAddress: string,
      method: string,
      returnValue: any
    ): Chainable<void>;

    /**
     * Mock contract write method with transaction options
     * @param contractAddress - Address of the contract
     * @param method - Name of the method to mock
     * @param options - Options for the mock transaction
     * @param options.success - Whether the transaction succeeds (default: true)
     * @param options.transactionHash - Hash of the mock transaction (default: '0xabc123def456')
     * @example
     * cy.mockContractWrite('0xContract123', 'approve', { success: true, transactionHash: '0xabc123' })
     */
    mockContractWrite(
      contractAddress: string,
      method: string,
      options?: {
        success?: boolean;
        transactionHash?: string;
        error?: string;
      }
    ): Chainable<void>;

    /**
     * Login helper specifically for token tests
     * @param userType - Type of user to login as ('admin' or 'user')
     * @example
     * cy.loginForTokenTests('admin')
     */
    loginForTokenTests(userType?: 'admin' | 'user'): Chainable<void>;

    /**
     * Wait for wallet to be ready
     * @param timeout - Maximum time to wait in milliseconds (default: 5000)
     * @example
     * cy.waitForWallet(10000)
     */
    waitForWallet(timeout?: number): Chainable<Window>;

    /**
     * Intercept and mock token-related API calls
     * @example
     * cy.interceptTokenAPI()
     */
    interceptTokenAPI(): Chainable<void>;

    /**
     * Skip test if a feature is disabled
     * @param featureName - Name of the feature flag to check
     * @example
     * cy.skipIfFeatureDisabled('NEXT_PUBLIC_FEATURE_TOKEN_SALE')
     */
    skipIfFeatureDisabled(featureName: string): Chainable<void>;
  }
}
