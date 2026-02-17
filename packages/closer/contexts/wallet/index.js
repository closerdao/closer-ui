import { useEffect, useState } from 'react';

import { WalletStateContext, WalletDispatchContext } from './hooks';

export const WalletState = WalletStateContext;
export const WalletDispatch = WalletDispatchContext;

const defaultDispatch = {
  connectWallet: async () => null,
  switchNetwork: async () => {},
  updateWalletBalance: () => {},
  updateCeurBalance: () => {},
  updateCeloBalance: () => {},
  refetchBookingDates: () => {},
  signMessage: async () => null,
};

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

const DefaultProvider = ({ children }) => (
  <WalletStateContext.Provider value={defaultState}>
    <WalletDispatchContext.Provider value={defaultDispatch}>
      {children}
    </WalletDispatchContext.Provider>
  </WalletStateContext.Provider>
);

export const WalletProvider = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [ReownProvider, setReownProvider] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (
      isMounted &&
      process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true'
    ) {
      import('./WalletProviderWithReown').then((mod) => {
        setReownProvider(() => mod.WalletProviderWithReown);
      });
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <WalletStateContext.Provider value={defaultState}>
        <WalletDispatchContext.Provider value={defaultDispatch}>
          {children}
        </WalletDispatchContext.Provider>
      </WalletStateContext.Provider>
    );
  }

  if (process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET !== 'true') {
    return <DefaultProvider>{children}</DefaultProvider>;
  }

  if (!ReownProvider) {
    return <DefaultProvider>{children}</DefaultProvider>;
  }

  return <ReownProvider>{children}</ReownProvider>;
};
