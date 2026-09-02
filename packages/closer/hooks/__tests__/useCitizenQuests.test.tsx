import React from 'react';

import { renderHook, waitFor } from '@testing-library/react';

import { WalletState } from '../../contexts/wallet';
// `.js` so the request resolves straight to the real module rather than through
// the `utils/api` name mapper, which is how the rest of the suite mocks it.
import api from '../../utils/api.js';
import { useCitizenQuests } from '../useCitizenQuests';

/*
 * The quests decide what the cards say and whether the apply button is enabled,
 * and `/subscription/citizen/apply` re-checks the same rules server-side. These
 * pin the places the two used to disagree: the presence count came from a
 * different endpoint than the presence verdict, and the token balance was read
 * off whichever wallet happened to be connected.
 */

let user: any = null;
let mockFinanceApplications: any[] = [];

jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: {} })) },
  formatSearch: () => '',
  invalidateGetCache: jest.fn(),
  cdn: '',
}));

jest.mock('../../contexts/auth', () => ({
  useAuth: () => user && { user },
}));

jest.mock('../useOpenFinanceApplications', () => ({
  useOpenFinanceApplications: () => ({
    applications: mockFinanceApplications,
    isLoading: false,
  }),
}));

jest.mock('../../utils/cachedConfig.helpers', () => ({
  getCachedConfig: () => ({
    tokensRequired: 30,
    minVouchingStayDuration: 14,
  }),
}));

const respondWith = (responses: Record<string, any>) => {
  (api.get as jest.Mock).mockImplementation((url: string) => {
    const match = Object.keys(responses).find((key) => url.includes(key));
    return Promise.resolve({ data: match ? responses[match] : {} });
  });
};

const DISCONNECTED = {
  isWalletConnected: false,
  isCorrectNetwork: false,
  hasSameConnectedAccount: false,
  balanceTotal: 0,
  proofOfPresence: 0,
};

const CONNECTED_AS_SELF = {
  ...DISCONNECTED,
  isWalletConnected: true,
  isCorrectNetwork: true,
  hasSameConnectedAccount: true,
};

const questsWith = (wallet: Record<string, unknown>) =>
  renderHook(() => useCitizenQuests(), {
    wrapper: ({ children }: { children?: React.ReactNode }) => (
      <WalletState.Provider value={wallet as any}>
        {children}
      </WalletState.Provider>
    ),
  });

describe('useCitizenQuests', () => {
  beforeEach(() => {
    mockFinanceApplications = [];
    user = {
      _id: 'user-1',
      roles: ['default'],
      vouched: [],
      stats: { wallet: { tdf: 0 } },
    };
    respondWith({});
  });

  it('shows the night count the presence check itself was judged on', async () => {
    respondWith({
      'check-has-stayed-for-min-duration': {
        hasStayedForMinDuration: true,
        totalNights: 21,
        minStayDuration: 14,
      },
      // The old, separate source — it must not win, or the card reads
      // "0 of 14 nights stayed" beside a passing quest.
      'stays/nights': { results: { totalNights: 0 } },
    });

    const { result } = questsWith(DISCONNECTED);

    await waitFor(() => expect(result.current.totalStayDays).toBe(21));
    expect(result.current.hasStayedForMinDuration).toBe(true);
  });

  it('falls back to /stays/nights when the check answers without a count', async () => {
    respondWith({
      'check-has-stayed-for-min-duration': { hasStayedForMinDuration: false },
      'stays/nights': { results: { totalNights: 7 } },
    });

    const { result } = questsWith(DISCONNECTED);

    await waitFor(() => expect(result.current.totalStayDays).toBe(7));
    expect(result.current.hasStayedForMinDuration).toBe(false);
  });

  it('reads the cached balance when the connected wallet is not the user own', () => {
    user.stats.wallet.tdf = 5;

    const { result } = questsWith({ ...DISCONNECTED, balanceTotal: 39 });

    // 39 tokens sit in a wallet the API has never seen; the API would judge
    // this application on the 5 it has cached.
    expect(result.current.tokenBalance).toBe(5);
    expect(result.current.ownsRequiredTokens).toBe(false);
  });

  it('reads the live balance once the wallet is the user own on the right network', () => {
    user.stats.wallet.tdf = 5;

    const { result } = questsWith({ ...CONNECTED_AS_SELF, balanceTotal: 39 });

    expect(result.current.tokenBalance).toBe(39);
    expect(result.current.ownsRequiredTokens).toBe(true);
  });

  it('counts a financed plan only once its deposit has cleared', () => {
    mockFinanceApplications = [
      { status: 'pending-payment', tokensToFinance: 30 },
    ];

    const { result, rerender } = questsWith(DISCONNECTED);
    expect(result.current.financedTokens).toBe(0);
    expect(result.current.isTokensCoveredByFinancePlan).toBe(false);

    mockFinanceApplications = [{ status: 'paid', tokensToFinance: 30 }];
    rerender();

    expect(result.current.financedTokens).toBe(30);
    expect(result.current.isTokensCoveredByFinancePlan).toBe(true);
  });

  it('needs presence, vouching and tokens together to call someone eligible', async () => {
    user.stats.wallet.tdf = 30;
    respondWith({
      'check-has-stayed-for-min-duration': {
        hasStayedForMinDuration: true,
        totalNights: 21,
      },
      'check-is-vouched': { isVouched: true },
    });

    const { result } = questsWith(DISCONNECTED);

    await waitFor(() => expect(result.current.isEligible).toBe(true));
  });

  it('is not eligible while the vouching check says no', async () => {
    user.stats.wallet.tdf = 30;
    respondWith({
      'check-has-stayed-for-min-duration': {
        hasStayedForMinDuration: true,
        totalNights: 21,
      },
      'check-is-vouched': { isVouched: false },
    });

    const { result } = questsWith(DISCONNECTED);

    await waitFor(() =>
      expect(result.current.hasStayedForMinDuration).toBe(true),
    );
    expect(result.current.isEligible).toBe(false);
  });
});
