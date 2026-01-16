/* eslint-disable no-unused-vars */

export interface Token {
  address?: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface WalletStateContext {
  isWalletConnected: boolean;
  isWalletReady: boolean;
  isCorrectNetwork: boolean;
  hasSameConnectedAccount: boolean;
  proofOfPresence: number;
  balanceAvailable: number;
  balanceTotal: number;
  balanceCeurAvailable: number;
  balanceCeloAvailable: number;
  account?: string | null;
  library: any;
  chainId?: number;
  error?: Error | null;
  bookedDates: any;
}

export interface WalletActionsContext {
  connectWallet: () => Promise<string | null>;
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
