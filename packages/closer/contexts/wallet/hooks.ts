import { createContext, useContext } from 'react';

export const WalletStateContext = createContext<any>(null);
export const WalletDispatchContext = createContext<any>(null);

export const defaultWalletState = {
  initializationStatus: 'disabled',
  isWalletInitializing: false,
  initializationSlow: false,
  connectionStage: 'idle',
  isWalletConnecting: false,
  isWalletSwitchingNetwork: false,
  isAppKitModalOpen: false,
  balanceStatus: 'idle',
  isBalanceLoading: false,
  balanceError: null,
  isWalletConnected: false,
  isWalletReady: false,
  isCorrectNetwork: false,
  hasSameConnectedAccount: false,
  account: null,
  balanceTotal: '0',
  balanceAvailable: '0',
  balanceAvailableWei: null,
  balanceCeurAvailableWei: null,
  balanceCeurAvailable: '0',
  balanceCeloAvailable: '0',
  balanceNativeAvailable: '0',
  proofOfPresence: '0',
  bookedDates: null,
  error: null,
  library: null,
  chainId: null,
};

export const defaultWalletDispatch = {
  getConnectedAccount: () => null,
  cancelWalletConnection: () => {},
  selectWallet: async () => {},
  refreshBalances: async () => {},
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
