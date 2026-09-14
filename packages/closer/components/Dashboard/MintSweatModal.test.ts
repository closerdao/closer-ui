import { describe, expect, it } from '@jest/globals';

import { buildMintSweatSubmissionEntries } from './MintSweatModal';

describe('buildMintSweatSubmissionEntries', () => {
  it('sends a member ID instead of exposing or depending on the private wallet', () => {
    expect(
      buildMintSweatSubmissionEntries([
        {
          id: 'entry-1',
          user: {
            _id: '000000000000000000000001',
            screenname: 'Member',
            hasWallet: true,
            walletAddress: '0x1111111111111111111111111111111111111111',
          },
          amount: '12.5',
          contributionDate: '2026-08-15',
        },
      ]),
    ).toEqual([
      {
        userId: '000000000000000000000001',
        amount: '12.5',
        contributionDate: '2026-08-15',
      },
    ]);
  });

  it('excludes selected users without wallets', () => {
    expect(
      buildMintSweatSubmissionEntries([
        {
          id: 'entry-1',
          user: {
            _id: '000000000000000000000001',
            screenname: 'Walletless member',
            hasWallet: false,
            walletAddress: null,
          },
          amount: '',
          contributionDate: '',
        },
      ]),
    ).toEqual([]);
  });
});
