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
});
