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
const SOLIDITY_PANIC_OVERFLOW =
  'The contract reverted with a math overflow or underflow (Solidity panic 0x11). Common causes: wrong wei amounts, overlapping or invalid booking nights, or a mismatch between what the UI sends and what the booking facet expects. Try refreshing; if it keeps happening, contact support.';

const SOLIDITY_PANIC_DIV_ZERO =
  'The contract reverted with division by zero (Solidity panic 0x12). Try again or contact support.';

const SOLIDITY_PANIC_ASSERT =
  'The contract reverted with an internal assertion (Solidity panic 0x01). Contact support if this persists.';

const PANIC_SELECTOR = '0x4e487b71';

function readPanicCodeFromObject(obj: any): number | null {
  if (obj?.errorName === 'Panic' && Array.isArray(obj?.errorArgs) && obj.errorArgs.length > 0) {
    const a = obj.errorArgs[0];
    if (a && typeof a === 'object' && 'hex' in a) {
      const h = String((a as { hex: string }).hex).replace(/^0x/i, '');
      if (/^[0-9a-f]+$/i.test(h)) return parseInt(h, 16);
    }
    if (typeof a === 'number' && Number.isFinite(a)) return a;
  }
  const data = typeof obj?.data === 'string' ? obj.data.toLowerCase() : '';
  if (
    data.startsWith(PANIC_SELECTOR) &&
    data.length >= 2 + 8 + 64
  ) {
    const argHex = data.slice(10, 10 + 64);
    if (/^[0-9a-f]+$/.test(argHex)) return parseInt(argHex, 16);
  }
  return null;
}

function parseSolidityPanicUserMessage(err: any): string | null {
  let code: number | null = null;
  for (const layer of [err, err?.error]) {
    if (!layer || typeof layer !== 'object') continue;
    code = readPanicCodeFromObject(layer);
    if (code !== null) break;
  }
  if (code === null && typeof err?.message === 'string') {
    const m = err.message.match(/panic code\s+(\d+)/i);
    if (m) code = parseInt(m[1], 10);
  }
  if (code === null) return null;
  switch (code) {
    case 0x01:
      return SOLIDITY_PANIC_ASSERT;
    case 0x11:
      return SOLIDITY_PANIC_OVERFLOW;
    case 0x12:
      return SOLIDITY_PANIC_DIV_ZERO;
    default:
      return `The contract reverted with Solidity panic code ${code} (see https://docs.soliditylang.org/en/latest/control-structures.html#panic-via-assert-and-fail). Contact support if you need help.`;
  }
}

export const parseSmartContractError = (err: any): string | null => {
  try {
    const panicMsg = parseSolidityPanicUserMessage(err);
    if (panicMsg) return panicMsg;

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
    'CALL_EXCEPTION',
    'panic',
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

const REVERT_PREFIX = 'execution reverted:';
const REVERT_PREFIX_LEN = REVERT_PREFIX.length;

function extractRevertReason(raw: string): string {
  const lower = raw.toLowerCase();
  const idx = lower.indexOf(REVERT_PREFIX);
  if (idx === -1) return raw.trim();
  let reason = raw.slice(idx + REVERT_PREFIX_LEN).trim();
  const colonIdx = reason.indexOf(':');
  if (colonIdx !== -1 && reason.slice(0, colonIdx).trim().length < 40) {
    reason = reason.slice(colonIdx + 1).trim();
  }
  const parenClose = reason.indexOf(')');
  if (reason.startsWith('(') && parenClose !== -1) {
    reason = reason.slice(parenClose + 1).trim();
  }
  return reason || raw.trim();
}

export type TokenSaleErrorCode =
  | 'MAX_SUPPLY'
  | 'INSUFFICIENT_BALANCE'
  | 'USER_REJECTED'
  | null;

export interface TokenSaleErrorResult {
  errorCode: TokenSaleErrorCode;
  userMessage: string;
}

export const parseTokenSaleError = (err: any): TokenSaleErrorResult | null => {
  if (!err || typeof err !== 'object') return null;
  const reason = err?.reason ?? err?.message ?? '';
  let str = typeof reason === 'string' ? reason : String(reason);
  if (err?.code === 'UNPREDICTABLE_GAS_LIMIT' && err?.message && !str.includes('execution reverted')) {
    str = err.message;
  }
  if (!str) return null;

  if (
    /user denied|user rejected|rejected the request/i.test(str) ||
    err?.code === 4001
  ) {
    return {
      errorCode: 'USER_REJECTED',
      userMessage: '',
    };
  }

  const lower = str.toLowerCase();
  if (
    lower.includes('maxsupply') ||
    lower.includes('maximum supply reached') ||
    lower.includes('max supply')
  ) {
    return {
      errorCode: 'MAX_SUPPLY',
      userMessage: extractRevertReason(str),
    };
  }

  if (
    lower.includes('exceeds balance') ||
    lower.includes('insufficient') ||
    lower.includes('transfer amount exceeds')
  ) {
    return {
      errorCode: 'INSUFFICIENT_BALANCE',
      userMessage: extractRevertReason(str),
    };
  }

  if (
    lower.includes('execution reverted') ||
    err?.code === 'UNPREDICTABLE_GAS_LIMIT'
  ) {
    return {
      errorCode: null,
      userMessage: extractRevertReason(str),
    };
  }

  if (str.length > 0 && (err?.message || err?.reason)) {
    return {
      errorCode: null,
      userMessage: extractRevertReason(str),
    };
  }

  return null;
};
