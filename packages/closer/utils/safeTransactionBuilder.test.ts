import { describe, expect, it } from '@jest/globals';
import { ethers } from 'ethers';

import {
  buildSweatBurnTransaction,
  buildSweatMintTransaction,
  contributionDateToDaysAgo,
} from './safeTransactionBuilder';

const wallet = '0x1111111111111111111111111111111111111111';
const sweatInterface = new ethers.utils.Interface([
  'function mintBatch(tuple(address account,uint256 amount,uint256 daysAgo)[] mintDataArray)',
  'function burn(address account,tuple(uint256 daysAgo,uint256 amount)[] burnDataArray) returns (uint256)',
]);

describe('Safe Transaction Builder SWEAT transactions', () => {
  it('uses UTC calendar days and rejects future contribution dates', () => {
    const now = new Date('2026-08-25T23:00:00.000Z');

    expect(contributionDateToDaysAgo('2026-08-24', now)).toBe(1);
    expect(contributionDateToDaysAgo('2026-08-26', now)).toBeNull();
    expect(contributionDateToDaysAgo('2026-02-30', now)).toBeNull();
  });

  it('encodes mintBatch as a single Safe transaction', () => {
    const transaction = buildSweatMintTransaction([
      { walletAddress: wallet, amount: '2.5', contributionDate: '2020-01-01' },
    ]);
    const decoded = sweatInterface.decodeFunctionData(
      'mintBatch',
      transaction.data!,
    );

    expect(decoded.mintDataArray[0].account).toBe(wallet);
    expect(decoded.mintDataArray[0].amount.toString()).toBe(
      '2500000000000000000',
    );
    expect(Number(decoded.mintDataArray[0].daysAgo)).toBeGreaterThan(0);
  });

  it('encodes dated burn amounts for the selected wallet', () => {
    const transaction = buildSweatBurnTransaction(wallet, [
      { amount: '1', contributionDate: '2020-01-01' },
    ]);
    const decoded = sweatInterface.decodeFunctionData(
      'burn',
      transaction.data!,
    );

    expect(decoded.account).toBe(wallet);
    expect(decoded.burnDataArray[0].amount.toString()).toBe(
      '1000000000000000000',
    );
  });
});
