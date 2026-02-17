import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import React from 'react';

jest.mock('closer/contexts/wallet', () => {
  const actual = jest.requireActual('closer/contexts/wallet');
  const defaultState = {
    isWalletConnected: false,
    isWalletReady: false,
    isCorrectNetwork: false,
    hasSameConnectedAccount: false,
    account: null,
    balanceTotal: '0',
    balanceAvailable: '0',
    balanceCeurAvailable: '0',
    balanceCeloAvailable: '0',
    proofOfPresence: '0',
    bookedDates: null,
    error: null,
    library: null,
    chainId: null,
  };
  const defaultDispatch = {
    connectWallet: async () => null,
    switchNetwork: async () => {},
    updateWalletBalance: () => {},
    updateCeurBalance: () => {},
    refetchBookingDates: () => {},
    signMessage: async () => null,
  };
  const WalletProvider = ({ children }) =>
    React.createElement(
      actual.WalletState.Provider,
      { value: defaultState },
      React.createElement(
        actual.WalletDispatch.Provider,
        { value: defaultDispatch },
        children,
      ),
    );
  return { ...actual, WalletProvider };
});

describe('Login', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should show Sign in with Wallet button when NEXT_PUBLIC_FEATURE_WEB3_WALLET is true', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
    const LoginWithWallet = require('@/pages/login').default;
    renderWithProviders(<LoginWithWallet />);

    expect(
      screen.getByRole('button', { name: /sign in with wallet/i }),
    ).toBeInTheDocument();
  });

  it('should not render Sign in with Wallet button when NEXT_PUBLIC_FEATURE_WEB3_WALLET is false', () => {
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';
    const LoginWithoutWallet = require('@/pages/login').default;
    renderWithProviders(<LoginWithoutWallet />);

    const walletButton = screen.queryByRole('button', {
      name: /sign in with wallet/i,
    });
    expect(walletButton).not.toBeInTheDocument();
  });
});
