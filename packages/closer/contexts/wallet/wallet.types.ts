/* eslint-disable no-unused-vars */

export interface Token {
  address?: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface WalletStateContext {
  initializationStatus: 'disabled' | 'loading' | 'ready' | 'error';
  isWalletInitializing: boolean;
  initializationSlow: boolean;
  connectionStage: 'idle' | 'connecting' | 'linking';
  isWalletConnecting: boolean;
  isWalletSwitchingNetwork: boolean;
  isAppKitModalOpen: boolean;
  balanceStatus: 'idle' | 'loading' | 'ready' | 'error';
  isBalanceLoading: boolean;
  balanceError: Error | null;
  isWalletConnected: boolean;
  isWalletReady: boolean;
  isCorrectNetwork: boolean;
  hasSameConnectedAccount: boolean;
  proofOfPresence: number;
  balanceAvailable: string;
  balanceAvailableWei: string | null;
  balanceCeurAvailableWei: string | null;
  balanceTotal: string;
  balanceCeurAvailable: string;
  balanceCeloAvailable: string;
  balanceNativeAvailable: string;
  account?: string | null;
  library: any;
  chainId?: number;
  error?: any;
  bookedDates: any;
}

export interface WalletActionsContext {
  getConnectedAccount: () => string | null;
  connectWallet: () => Promise<string | null>;
  cancelWalletConnection: () => void;
  selectWallet: () => Promise<void>;
  refreshBalances: () => Promise<unknown>;
  updateWalletBalance: () => void;
  updateCeurBalance: () => void;
  updateCeloBalance: () => void;
  refetchBookingDates: () => void;
  signMessage: (msg: string, accountId: string) => Promise<string | null>;
  switchNetwork: () => Promise<void>;
}

interface ABIInputItem {
  name: string;
  type: string;
  internalType?: string;
  components: ABIInputItem[];
}

export interface ABI {
  [key: string]: {
    inputs: ABIInputItem[];
    name: string;
    outputs: {
      name: string;
      type: string;
    }[];
    stateMutability: string;
    type: string;
  };
}
