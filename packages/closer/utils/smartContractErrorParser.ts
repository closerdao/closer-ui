/**
 * Smart Contract Error Parser
 *
 * This utility provides functions to parse and extract meaningful error messages
 * from complex smart contract transaction errors, particularly from ethers.js
 * and MetaMask error objects.
 */

export interface SmartContractError {
  code?: string;
  reason?: string;
  message?: string;
  error?: {
    code?: number;
    message?: string;
    data?: {
      message?: string;
      code?: number;
    };
  };
}

/**
 * Parses smart contract errors to extract user-friendly error messages
 * @param err - The error object from smart contract transactions
 * @returns A clean, user-friendly error message or null if not a smart contract error
 */
export const parseSmartContractError = (err: any): string | null => {
  try {
    // Handle ethers.js gas estimation errors
    if (err?.code === 'UNPREDICTABLE_GAS_LIMIT' && err?.reason) {
      return `cannot estimate gas; transaction may fail or may require manual gas limit. Reason: ${err.reason}`;
    }

    // Handle JSON-RPC errors with nested data
    if (err?.error?.data?.message) {
      return err.error.data.message;
    }

    // Handle ethers.js errors with reason
    if (err?.reason) {
      return err.reason;
    }

    // Handle errors with nested error structure
    if (err?.error?.message) {
      return err.error.message;
    }

    // Handle MetaMask/Web3 errors
    if (err?.message && err.message.includes('execution reverted')) {
      return err.message;
    }

    // Handle specific error patterns
    if (
      err?.message &&
      err.message.includes('ERC20: transfer amount exceeds balance')
    ) {
      return 'Insufficient token balance for this transaction';
    }

    if (err?.message && err.message.includes('User denied transaction')) {
      return 'Transaction was rejected by user';
    }

    return null;
  } catch (parseError) {
    console.error('Error parsing smart contract error:', parseError);
    return null;
  }
};

/**
 * Checks if an error is a smart contract related error
 * @param err - The error object to check
 * @returns True if the error appears to be from a smart contract transaction
 */
export const isSmartContractError = (err: any): boolean => {
  if (!err || typeof err !== 'object') {
    return false;
  }

  // Check for common smart contract error indicators
  const indicators = [
    'UNPREDICTABLE_GAS_LIMIT',
    'execution reverted',
    'ERC20:',
    'User denied transaction',
    'User rejected transaction',
    'insufficient funds',
    'gas required exceeds allowance',
  ];

  const errorString = JSON.stringify(err).toLowerCase();
  return indicators.some((indicator) =>
    errorString.includes(indicator.toLowerCase()),
  );
};

/**
 * Extracts the core error message from complex smart contract errors
 * @param err - The error object
 * @returns A simplified error message focusing on the root cause
 */
export const extractCoreErrorMessage = (err: any): string => {
  const smartContractError = parseSmartContractError(err);
  if (smartContractError) {
    return smartContractError;
  }

  // Fallback to basic error message extraction
  if (err?.message) {
    return err.message;
  }

  if (err?.error?.message) {
    return err.error.message;
  }

  return 'An unknown error occurred';
};
