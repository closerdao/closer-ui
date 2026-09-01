import { BigNumber, BigNumberish } from 'ethers';

import {
  BOOK_ACCOMMODATION_BLOCK_GAS_LIMIT_PERCENT,
  BOOK_ACCOMMODATION_GAS_BUFFER_PERCENT,
} from '../constants/shared.constants';

const PERCENT_DENOMINATOR = 100;

export type AccommodationBookingGasEstimate = {
  batchSize: number;
  estimatedGas: BigNumber;
  gasLimit: BigNumber;
  requiresMultipleTransactions: boolean;
};

export const addAccommodationBookingGasBuffer = (
  estimatedGas: BigNumberish,
): BigNumber =>
  BigNumber.from(estimatedGas)
    .mul(PERCENT_DENOMINATOR + BOOK_ACCOMMODATION_GAS_BUFFER_PERCENT)
    .add(PERCENT_DENOMINATOR - 1)
    .div(PERCENT_DENOMINATOR);

export const getAccommodationBookingGasCeiling = (
  blockGasLimit: BigNumberish,
): BigNumber =>
  BigNumber.from(blockGasLimit)
    .mul(BOOK_ACCOMMODATION_BLOCK_GAS_LIMIT_PERCENT)
    .div(PERCENT_DENOMINATOR);

const messageFromError = (error: unknown): string => {
  if (!error || typeof error !== 'object') return String(error || '');
  const candidate = error as {
    reason?: unknown;
    message?: unknown;
    error?: { message?: unknown };
  };
  return [candidate.reason, candidate.message, candidate.error?.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
};

// Only capacity-related estimation failures are safe to retry with fewer
// nights. Business-logic reverts must be surfaced before an earlier batch is
// sent and leaves the stay partially staked.
export const isGasCapacityEstimateError = (error: unknown): boolean => {
  const message = messageFromError(error);
  return (
    message.includes('gas required exceeds allowance') ||
    message.includes('exceeds block gas limit') ||
    message.includes('transaction gas limit') ||
    message.includes('out of gas')
  );
};

export const findLargestAccommodationBookingBatch = async <T>({
  items,
  gasCeiling,
  estimateGas,
}: {
  items: T[];
  gasCeiling: BigNumberish;
  estimateGas: (candidate: T[]) => Promise<BigNumberish>;
}): Promise<AccommodationBookingGasEstimate> => {
  if (items.length === 0) {
    throw new Error('No accommodation nights remain to stake.');
  }

  const ceiling = BigNumber.from(gasCeiling);
  let fullEstimateError: unknown;

  try {
    const estimatedGas = BigNumber.from(await estimateGas(items));
    const gasLimit = addAccommodationBookingGasBuffer(estimatedGas);
    if (gasLimit.lte(ceiling)) {
      return {
        batchSize: items.length,
        estimatedGas,
        gasLimit,
        requiresMultipleTransactions: false,
      };
    }
  } catch (error) {
    if (!isGasCapacityEstimateError(error)) throw error;
    fullEstimateError = error;
  }

  let low = 1;
  let high = Math.max(1, items.length - 1);
  let best: AccommodationBookingGasEstimate | null = null;
  let smallestEstimateError: unknown;

  while (low <= high) {
    const size = Math.floor((low + high) / 2);
    try {
      const estimatedGas = BigNumber.from(
        await estimateGas(items.slice(0, size)),
      );
      const gasLimit = addAccommodationBookingGasBuffer(estimatedGas);
      if (gasLimit.lte(ceiling)) {
        best = {
          batchSize: size,
          estimatedGas,
          gasLimit,
          requiresMultipleTransactions: true,
        };
        low = size + 1;
      } else {
        high = size - 1;
      }
    } catch (error) {
      if (!isGasCapacityEstimateError(error)) throw error;
      if (size === 1) smallestEstimateError = error;
      high = size - 1;
    }
  }

  if (best) return best;

  const error = new Error(
    'Unable to estimate a safe gas limit for one accommodation night.',
  );
  (error as Error & { cause?: unknown }).cause =
    smallestEstimateError || fullEstimateError;
  throw error;
};
