import React from 'react';

import { renderHook } from '@testing-library/react';

import { WalletState } from '../../contexts/wallet';
import { useResidencyStanding } from '../useResidencyParams';

/** The auth user and chain reads the hook sees, swapped per test. */
let user: any = null;
const chain = { presenceBalance: '0', sweatBalance: '0' };

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user }),
  AuthProvider: ({ children }: any) => children,
}));
jest.mock('../usePresenceToken', () => ({
  usePresenceToken: () => ({
    presenceBalance: chain.presenceBalance,
    isLoading: false,
  }),
}));
jest.mock('../useSweatToken', () => ({
  useSweatToken: () => ({ sweatBalance: chain.sweatBalance, isLoading: false }),
}));

const DISCONNECTED = {
  isWalletConnected: false,
  isWalletReady: false,
  isCorrectNetwork: false,
  hasSameConnectedAccount: false,
  balanceTotal: '0',
};

const CONNECTED = {
  isWalletConnected: true,
  isWalletReady: true,
  isCorrectNetwork: true,
  hasSameConnectedAccount: true,
  balanceTotal: '0',
};

const standingWith = (wallet: Record<string, unknown>) =>
  renderHook(() => useResidencyStanding(), {
    wrapper: ({ children }: { children?: React.ReactNode }) => (
      <WalletState.Provider value={wallet as any}>
        {children}
      </WalletState.Provider>
    ),
  }).result.current;

describe('useResidencyStanding', () => {
  beforeEach(() => {
    chain.presenceBalance = '0';
    chain.sweatBalance = '0';
    user = { stats: { wallet: { presence: 500, tdf: 78, sweat: 120 } } };
  });

  it('reads the balances cached on the user by default', () => {
    const { standing, hasLiveBalances } = standingWith(DISCONNECTED);
    expect(standing).toEqual({
      presence: 500,
      tokensHeld: 78,
      sweat: 120,
      // Displayed, but not spendable: locking needs a wallet.
      lockableTokens: 0,
    });
    expect(hasLiveBalances).toBe(false);
  });

  it('falls back to the legacy top-level presence field', () => {
    user = { presence: 42, stats: {} };
    expect(standingWith(DISCONNECTED).standing.presence).toBe(42);
  });

  it('reads zeroes for a signed-out visitor rather than blowing up', () => {
    user = null;
    expect(standingWith(DISCONNECTED).standing).toEqual({
      presence: 0,
      tokensHeld: 0,
      sweat: 0,
      lockableTokens: 0,
    });
  });

  it('prefers the chain once the member connects their own wallet', () => {
    chain.presenceBalance = '512';
    const { standing, hasLiveBalances } = standingWith({
      ...CONNECTED,
      balanceTotal: '90',
    });
    expect(hasLiveBalances).toBe(true);
    expect(standing.presence).toBe(512);
    expect(standing.tokensHeld).toBe(90);
  });

  it('ignores the chain while the wallet is on the wrong network', () => {
    chain.presenceBalance = '512';
    const { standing, hasLiveBalances } = standingWith({
      ...CONNECTED,
      isCorrectNetwork: false,
    });
    expect(hasLiveBalances).toBe(false);
    expect(standing.presence).toBe(500);
  });

  it('ignores the chain while a different account is connected', () => {
    chain.presenceBalance = '512';
    expect(
      standingWith({ ...CONNECTED, hasSameConnectedAccount: false }).standing
        .presence,
    ).toBe(500);
  });

  it('only lets a live wallet back a lock', () => {
    // The cached 78 tokens are shown but cannot be spent...
    expect(standingWith(DISCONNECTED).standing.lockableTokens).toBe(0);
    // ...while a connected wallet's balance can.
    expect(
      standingWith({ ...CONNECTED, balanceTotal: '90' }).standing
        .lockableTokens,
    ).toBe(90);
  });

  it('keeps the cached $Sweat when the chain read comes back empty', () => {
    expect(standingWith(CONNECTED).standing.sweat).toBe(120);
  });

  it('rounds fractional balances down', () => {
    user = { stats: { wallet: { presence: 500.9, tdf: 77.6, sweat: 0 } } };
    const { standing } = standingWith(DISCONNECTED);
    expect(standing.presence).toBe(500);
    expect(standing.tokensHeld).toBe(77);
  });
});
