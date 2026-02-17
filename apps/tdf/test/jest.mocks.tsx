import React from 'react';

process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';

jest.mock('closer/contexts/wallet', () => {
  const React = require('react');
  const actual = jest.requireActual('closer/contexts/wallet');
  const {
    WalletStateContext,
    WalletDispatchContext,
  } = jest.requireActual('closer/contexts/wallet/hooks');

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
    updateCeloBalance: () => {},
    refetchBookingDates: () => {},
    signMessage: async () => null,
  };

  const DefaultProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      WalletStateContext.Provider,
      { value: defaultState },
      React.createElement(
        WalletDispatchContext.Provider,
        { value: defaultDispatch },
        children,
      ),
    );

  return {
    ...actual,
    WalletProvider: ({ children }: { children?: React.ReactNode }) =>
      DefaultProvider({ children }),
  };
});
process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS = 'true';
process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.example.com';
process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY =
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY || 'pk_test_mock';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, fill, ...imgProps } = props;
    return <img {...imgProps} />;
  },
}));
