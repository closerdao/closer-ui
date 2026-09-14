import { BigNumber } from 'ethers';

import {
  addAccommodationBookingGasBuffer,
  findLargestAccommodationBookingBatch,
  getAccommodationBookingGasCeiling,
  isGasCapacityEstimateError,
} from '../accommodationBookingGas';

describe('accommodation booking gas', () => {
  it('adds a rounded-up 25% buffer', () => {
    expect(addAccommodationBookingGasBuffer(13_320_250).toString()).toBe(
      '16650313',
    );
    expect(addAccommodationBookingGasBuffer(1).toString()).toBe('2');
  });

  it('uses 90% of the block gas limit', () => {
    expect(getAccommodationBookingGasCeiling(30_000_000).toString()).toBe(
      '27000000',
    );
  });

  it('keeps all nights in one transaction when they fit', async () => {
    const items = Array.from({ length: 42 }, (_, index) => index);
    const result = await findLargestAccommodationBookingBatch({
      items,
      gasCeiling: 27_000_000,
      estimateGas: async () => BigNumber.from(13_320_250),
    });

    expect(result.batchSize).toBe(42);
    expect(result.gasLimit.toString()).toBe('16650313');
    expect(result.requiresMultipleTransactions).toBe(false);
  });

  it('finds the largest chronological prefix that fits', async () => {
    const items = Array.from({ length: 10 }, (_, index) => index);
    const result = await findLargestAccommodationBookingBatch({
      items,
      gasCeiling: 27_000_000,
      estimateGas: async (candidate) =>
        BigNumber.from(candidate.length).mul(3_000_000),
    });

    expect(result.batchSize).toBe(7);
    expect(result.gasLimit.toString()).toBe('26250000');
    expect(result.requiresMultipleTransactions).toBe(true);
  });

  it('retries capacity errors with a smaller prefix', async () => {
    const items = Array.from({ length: 10 }, (_, index) => index);
    const result = await findLargestAccommodationBookingBatch({
      items,
      gasCeiling: 27_000_000,
      estimateGas: async (candidate) => {
        if (candidate.length > 6) {
          throw new Error('gas required exceeds allowance (30000000)');
        }
        return BigNumber.from(candidate.length).mul(3_000_000);
      },
    });

    expect(result.batchSize).toBe(6);
  });

  it('does not hide business-logic estimation failures by splitting', async () => {
    const failure = new Error('execution reverted: insufficient balance');
    await expect(
      findLargestAccommodationBookingBatch({
        items: [1, 2, 3],
        gasCeiling: 27_000_000,
        estimateGas: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);
  });

  it('recognizes common block-capacity errors', () => {
    expect(
      isGasCapacityEstimateError(
        new Error('transaction gas limit exceeds block gas limit'),
      ),
    ).toBe(true);
    expect(
      isGasCapacityEstimateError(new Error('execution reverted: out of gas')),
    ).toBe(true);
  });
});
