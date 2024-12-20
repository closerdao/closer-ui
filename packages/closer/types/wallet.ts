/* eslint-disable no-unused-vars */
import { InjectedConnector } from '@web3-react/injected-connector';

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
  balanceAvailable: string;
  balanceTotal: string;
  account?: string | null;
  library: any;
  injected: InjectedConnector;
  bookedDates: any;
}

export interface WalletActionsContext {
  connectWallet: () => void;
  updateWalletBalance: () => void;
  refetchBookingDates: () => void;
  signMessage: (msg: string, accountId: string) => Promise<string>;
  switchNetwork: () => void;
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
