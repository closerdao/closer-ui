import { createContext, useContext } from 'react';

export const WalletStateContext = createContext<any>(null);
export const WalletDispatchContext = createContext<any>(null);

const defaultWalletState = {
  isWalletConnected: false,
  isWalletReady: false,
  isCorrectNetwork: false,
  hasSameConnectedAccount: false,
  account: null,
  balanceTotal: '0',
  balanceAvailable: '0',
  balanceCeurAvailable: '0',
  balanceCeloAvailable: '0',
  balanceNativeAvailable: '0',
  proofOfPresence: '0',
  bookedDates: null,
  error: null,
  library: null,
  chainId: null,
};

const defaultWalletDispatch = {
  connectWallet: async () => {
    return null;
  },
  switchNetwork: async () => {},
  updateWalletBalance: () => {},
  updateCeurBalance: () => {},
  updateCeloBalance: () => {},
  refetchBookingDates: () => {},
  signMessage: async () => null,
};

export const useWalletState = () => {
  const context = useContext(WalletStateContext);
  return context || defaultWalletState;
};

export const useWalletDispatch = () => {
  const context = useContext(WalletDispatchContext);
  return context || defaultWalletDispatch;
};

export const useWallet = () => {
  const state = useWalletState();
  const dispatch = useWalletDispatch();

  return {
    ...state,
    ...dispatch,
  };
};
