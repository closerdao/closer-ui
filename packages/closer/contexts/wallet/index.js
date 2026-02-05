import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Web3Provider } from '@ethersproject/providers';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from '@reown/appkit/react';
import { BigNumber } from 'ethers';
import useSWR from 'swr';

import { celoMainnet, alfajores, celoSepolia } from '../../appkit';
import { blockchainConfig } from '../../config_blockchain';
import api from '../../utils/api';
import {
  fetcher,
  formatBigNumberForDisplay,
  multiFetcher,
} from '../../utils/blockchain';
import { useAuth } from '../auth';
import { WalletStateContext, WalletDispatchContext } from './hooks';

export const WalletState = WalletStateContext;
export const WalletDispatch = WalletDispatchContext;

const {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_NETWORK_ID,
  BLOCKCHAIN_CEUR_TOKEN,
  BLOCKCHAIN_CELO_TOKEN,
  BLOCKCHAIN_PRESENCE_ABI,
  BLOCKCHAIN_PRESENCE_TOKEN,
} = blockchainConfig;

// Default no-op dispatch for SSR
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

// Inner provider that uses AppKit hooks — only rendered on the client
const WalletProviderInner = ({ children }) => {
  const getTargetNetwork = () => {
    if (BLOCKCHAIN_NETWORK_ID === 42220) return celoMainnet;
    if (BLOCKCHAIN_NETWORK_ID === 11142220) return celoSepolia;
    return alfajores;
  };

  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId, switchNetwork: appKitSwitchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  const { user } = useAuth();

  const [error, setError] = useState(null);

  // Track pending connection promises for the login flow
  const connectResolveRef = useRef(null);

  const account = address || null;
  const isWalletConnected = isConnected;

  // Create ethers Web3Provider from AppKit's walletProvider
  const library = useMemo(() => {
    if (!walletProvider) return null;
    try {
      return new Web3Provider(walletProvider);
    } catch (e) {
      console.error('[WalletProvider] Failed to create Web3Provider:', e);
      return null;
    }
  }, [walletProvider]);

  const isCorrectNetwork = Number(BLOCKCHAIN_NETWORK_ID) === Number(chainId);
  const hasSameConnectedAccount =
    user?.walletAddress?.toLowerCase() === account?.toLowerCase();

  const [isWalletReady, setIsWalletReady] = useState(false);

  useEffect(() => {
    setIsWalletReady(
      isWalletConnected && isCorrectNetwork && hasSameConnectedAccount,
    );
  }, [chainId, isWalletConnected, account, error, user?.walletAddress]);

  // Resolve pending connectWallet promise when account becomes available
  useEffect(() => {
    if (isConnected && address && connectResolveRef.current) {
      const resolve = connectResolveRef.current;
      connectResolveRef.current = null;
      resolve(address);
    }
  }, [isConnected, address]);

  const { data: balanceDAOToken, mutate: updateWalletBalance } = useSWR(
    library && account
      ? [BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
      fallbackData: null,
    },
  );

  const { data: balanceCeurToken, mutate: updateCeurBalance } = useSWR(
    library && account
      ? [BLOCKCHAIN_CEUR_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: balanceCeloToken, mutate: updateCeloBalance } = useSWR(
    library && account
      ? [BLOCKCHAIN_CELO_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: stakedBalanceOf } = useSWR(
    library && account
      ? [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'stakedBalanceOf', account]
      : null,
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: unlockedStake } = useSWR(
    library && account
      ? [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'unlockedStake', account]
      : null,
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: balancePresence } = useSWR(
    library && account
      ? [BLOCKCHAIN_PRESENCE_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: fetcher(library, BLOCKCHAIN_PRESENCE_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: activatedBookingYears, error: activatedBookingYearsError } =
    useSWR(
      library
        ? [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'getAccommodationYears']
        : null,
      {
        fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      },
    );
  const {
    data: bookedDates,
    mutate: refetchBookingDates,
    error: bookedDatesError,
  } = useSWR(
    library && activatedBookingYears && account
      ? [
          activatedBookingYears.map(([year]) => [
            BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
            'getAccommodationBookings',
            account,
            year,
          ]),
        ]
      : null,
    {
      fetcher: multiFetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  // Ensure refetchBookingDates is always a function
  const safeRefetchBookingDates = refetchBookingDates || (() => {});

  const proofOfPresenceFromBookings = bookedDates
    ?.flat()
    .filter((date) => date.status === 2).length;

  const balanceTotal = formatBigNumberForDisplay(
    (balanceDAOToken || BigNumber.from(0)).add(stakedBalanceOf),
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceAvailable = formatBigNumberForDisplay(
    (balanceDAOToken || BigNumber.from(0)).add(unlockedStake),
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceCeurAvailable = formatBigNumberForDisplay(
    balanceCeurToken,
    BLOCKCHAIN_CEUR_TOKEN.decimals,
  );
  const balanceCeloAvailable = formatBigNumberForDisplay(
    balanceCeloToken,
    BLOCKCHAIN_CELO_TOKEN.decimals,
  );
  const proofOfPresence = formatBigNumberForDisplay(
    balancePresence,
    BLOCKCHAIN_PRESENCE_TOKEN.decimals,
  );

  const connectWallet = useCallback(async () => {
    console.log('[connectWallet] called');
    try {
      // If already connected, return the current address
      if (isConnected && address) {
        console.log('[connectWallet] already connected, returning address:', address);

        if (user && user._id && !user.walletAddress) {
          await linkWalletWithUser(address, user);
        }

        return address;
      }

      // Open the AppKit modal and wait for connection
      const connectedAccount = await new Promise((resolve) => {
        connectResolveRef.current = resolve;

        open({ view: 'Connect' }).catch(() => {
          // Modal was closed without connecting
          if (connectResolveRef.current) {
            connectResolveRef.current = null;
            resolve(null);
          }
        });

        // Timeout: if no connection after 5 minutes, resolve with null
        setTimeout(() => {
          if (connectResolveRef.current) {
            connectResolveRef.current = null;
            resolve(null);
          }
        }, 300000);
      });

      console.log('[connectWallet] connection result:', connectedAccount);

      if (connectedAccount && user && user._id && !user.walletAddress) {
        console.log(
          `[connectWallet] User ${user._id} authenticated, no wallet linked. Wallet ${connectedAccount} connected. Attempting to link.`,
        );
        await linkWalletWithUser(connectedAccount, user);
      }

      return connectedAccount;
    } catch (e) {
      console.log('[connectWallet] Exception during connectWallet process:', e);
      return null;
    }
  }, [isConnected, address, user, open]);

  const linkWalletWithUser = async (accountId, currentUser) => {
    if (!currentUser || !currentUser._id) {
      console.error(
        '[linkWalletWithUser] User object or user._id is not available. Cannot link wallet.',
      );
      return null;
    }
    if (!accountId) {
      console.error(
        '[linkWalletWithUser] accountId not provided. Cannot link wallet.',
      );
      return null;
    }
    console.log(
      `[linkWalletWithUser] Attempting to link account ${accountId} with user ${currentUser._id}`,
    );
    try {
      const {
        data: { nonce },
      } = await api.post('/auth/web3/pre-sign', { walletAddress: accountId });
      const message = `Signing in with code ${nonce}`;
      const signedMessage = await signMessage(message, accountId);
      if (!signedMessage) {
        console.error('[linkWalletWithUser] Failed to sign message.');
        return null;
      }
      const {
        data: { results: userUpdated },
      } = await api.post('/auth/web3/connect', {
        signedMessage,
        walletAddress: accountId,
        message,
        userId: user?._id,
      });
      console.log(
        '[linkWalletWithUser] Wallet linked successfully. User data updated:',
        userUpdated,
      );
      return userUpdated;
    } catch (error) {
      console.error(
        '[linkWalletWithUser] Error during API call to link wallet:',
        error,
      );
      return null;
    }
  };

  const switchNetwork = useCallback(async () => {
    try {
      const targetNetwork = getTargetNetwork();
      await appKitSwitchNetwork(targetNetwork);
    } catch (switchError) {
      console.error('[switchNetwork] Error switching network:', switchError);
      setError(switchError);
    }
  }, [appKitSwitchNetwork]);

  const signMessage = useCallback(async (msg, accountId) => {
    if (!walletProvider) {
      console.error('[signMessage] No wallet provider available');
      return null;
    }
    try {
      const signedMessage = await walletProvider.request({
        method: 'personal_sign',
        params: [msg, accountId],
      });
      return signedMessage;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [walletProvider]);

  return (
    <WalletState.Provider
      value={{
        isWalletConnected,
        isWalletReady,
        isCorrectNetwork,
        hasSameConnectedAccount,
        account,
        balanceTotal,
        balanceAvailable,
        balanceCeurAvailable,
        balanceCeloAvailable,
        proofOfPresence,
        bookedDates,
        error,
        library,
        chainId,
      }}
    >
      <WalletDispatch.Provider
        value={{
          connectWallet,
          switchNetwork,
          updateWalletBalance,
          updateCeurBalance,
          updateCeloBalance,
          refetchBookingDates: safeRefetchBookingDates,
          signMessage,
        }}
      >
        {children}
      </WalletDispatch.Provider>
    </WalletState.Provider>
  );
};

// Outer provider: renders default state on server, real provider on client
export const WalletProvider = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <WalletState.Provider value={defaultState}>
        <WalletDispatch.Provider value={defaultDispatch}>
          {children}
        </WalletDispatch.Provider>
      </WalletState.Provider>
    );
  }

  return <WalletProviderInner>{children}</WalletProviderInner>;
};
