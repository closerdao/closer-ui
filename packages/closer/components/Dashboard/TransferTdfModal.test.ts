import { describe, expect, it } from '@jest/globals';

import {
  type TransferEntry,
  buildTransferSubmissionEntries,
} from './TransferTdfModal';

const walletOne = '0x1111111111111111111111111111111111111111';
const walletTwo = '0x2222222222222222222222222222222222222222';

const entry = (overrides: Partial<TransferEntry> = {}): TransferEntry => ({
  id: 'entry-1',
  user: {
    _id: 'user-1',
    screenname: 'First user',
    hasWallet: true,
    walletAddress: walletOne,
  },
  amount: '12.5',
  mintSweat: false,
  contributionDate: '2026-08-15',
  ...overrides,
});

describe('buildTransferSubmissionEntries', () => {
  it('uses the TDF amount and contribution date for checked SWEAT rows', () => {
    const result = buildTransferSubmissionEntries([
      entry({ mintSweat: true }),
      entry({
        id: 'entry-2',
        user: {
          _id: 'user-2',
          screenname: 'Second user',
          hasWallet: true,
          walletAddress: walletTwo,
        },
        amount: '3',
      }),
    ]);

    expect(result.transferEntries).toEqual([
      { userId: 'user-1', amount: '12.5' },
      { userId: 'user-2', amount: '3' },
    ]);
    expect(result.sweatEntries).toEqual([
      {
        userId: 'user-1',
        amount: '12.5',
        contributionDate: '2026-08-15',
      },
    ]);
    expect(result.isComplete).toBe(true);
  });

  it('excludes a selected walletless user without blocking valid rows', () => {
    const result = buildTransferSubmissionEntries([
      entry(),
      entry({
        id: 'entry-2',
        user: {
          _id: 'user-2',
          screenname: 'Walletless user',
          hasWallet: false,
          walletAddress: null,
        },
        amount: '',
        contributionDate: '',
      }),
    ]);

    expect(result.transferEntries).toEqual([
      { userId: 'user-1', amount: '12.5' },
    ]);
    expect(result.isComplete).toBe(true);
  });

  it('blocks the whole submission when any transfer row is incomplete', () => {
    const result = buildTransferSubmissionEntries([
      entry({ mintSweat: true, contributionDate: '' }),
      entry({ id: 'entry-2', user: null, mintSweat: true }),
      entry({ id: 'entry-3', amount: '0', mintSweat: true }),
    ]);

    expect(result.transferEntries).toEqual([]);
    expect(result.sweatEntries).toEqual([]);
    expect(result.isComplete).toBe(false);
  });
});
