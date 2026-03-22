import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Web3Provider } from '@ethersproject/providers';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
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

const {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_NETWORK_ID,
  BLOCKCHAIN_CEUR_TOKEN,
  BLOCKCHAIN_CELO_TOKEN,
  BLOCKCHAIN_NATIVE_TOKEN,
  BLOCKCHAIN_PRESENCE_ABI,
  BLOCKCHAIN_PRESENCE_TOKEN,
} = blockchainConfig;

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
  const { open: isAppKitModalOpen } = useAppKitState();
  const { user, refetchUser } = useAuth();

  const [error, setError] = useState(null);

  const connectResolveRef = useRef(null);
  const connectFinalizeRef = useRef(null);
  const connectPromiseRef = useRef(null);
  const connectTimeoutRef = useRef(null);

  const account = address || null;
  const isWalletConnected = isConnected;

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

  useEffect(() => {
    if (isConnected && address && connectResolveRef.current) {
      const finalize = connectFinalizeRef.current;
      if (finalize) {
        finalize(address);
      }
    }
  }, [isConnected, address]);

  const modalCloseTimerRef = useRef(null);
  useEffect(() => {
    if (!isAppKitModalOpen && !isConnected && connectResolveRef.current) {
      modalCloseTimerRef.current = setTimeout(() => {
        if (connectResolveRef.current && !isConnected) {
          const finalize = connectFinalizeRef.current;
          if (finalize) {
            finalize(null);
          }
        }
      }, 1500);
    }
    return () => {
      if (modalCloseTimerRef.current) {
        clearTimeout(modalCloseTimerRef.current);
        modalCloseTimerRef.current = null;
      }
    };
  }, [isAppKitModalOpen, isConnected]);

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

  const { data: nativeBalance } = useSWR(
    library && account ? [library, account, 'nativeBalance'] : null,
    {
      fetcher: ([lib, acc]) => lib.getBalance(acc),
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

  const { data: activatedBookingYears } = useSWR(
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

  const safeRefetchBookingDates = refetchBookingDates || (() => {});

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
  const balanceNativeAvailable = formatBigNumberForDisplay(
    nativeBalance,
    BLOCKCHAIN_NATIVE_TOKEN.decimals,
  );
  const proofOfPresence = formatBigNumberForDisplay(
    balancePresence,
    BLOCKCHAIN_PRESENCE_TOKEN.decimals,
  );

  const getErrorCode = (err) => {
    if (!err) return null;

    const code = Number(err?.code);
    if (!Number.isNaN(code) && code !== 0) return code;

    const nested =
      getErrorCode(err?.cause) ||
      getErrorCode(err?.error) ||
      getErrorCode(err?.data?.originalError) ||
      getErrorCode(err?.originalError);
    if (nested) return nested;

    const message = `${err?.message || ''} ${err?.stack || ''}`;
    if (message.includes('4902') || message.includes('Unrecognized chain ID')) {
      return 4902;
    }

    return null;
  };

  const ensureTargetNetwork = useCallback(async () => {
    const targetNetwork = getTargetNetwork();

    if (Number(chainId) === Number(targetNetwork.id)) {
      setError(null);
      return;
    }

    const provider =
      walletProvider?.request
        ? walletProvider
        : typeof window !== 'undefined' && window.ethereum?.request
          ? window.ethereum
          : null;

    if (!provider?.request) {
      throw new Error('No EIP-1193 provider available for network switch');
    }

    const chainIdHex = `0x${Number(targetNetwork.id).toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError) {
      const errorCode = getErrorCode(switchError);

      if (errorCode === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: targetNetwork.name,
              nativeCurrency: targetNetwork.nativeCurrency,
              rpcUrls: targetNetwork?.rpcUrls?.default?.http || [],
              blockExplorerUrls: targetNetwork?.blockExplorers?.default?.url
                ? [targetNetwork.blockExplorers.default.url]
                : [],
            },
          ],
        });

        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } else {
        throw switchError;
      }
    }

    try {
      await appKitSwitchNetwork(targetNetwork);
    } catch {
      // no-op
    }

    setError(null);
  }, [chainId, walletProvider, appKitSwitchNetwork]);

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
      await refetchUser();
      return userUpdated;
    } catch (error) {
      console.error(
        '[linkWalletWithUser] Error during API call to link wallet:',
        error,
      );
      return null;
    }
  };

  const connectWallet = useCallback(async () => {
    try {
      if (isConnected && address) {
        if (user && user._id && !user.walletAddress) {
          await linkWalletWithUser(address, user);
        }
        return address;
      }

      if (connectPromiseRef.current) {
        return connectPromiseRef.current;
      }

      connectPromiseRef.current = new Promise((resolve) => {
        const finalizeConnect = (result) => {
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = null;
          }
          connectResolveRef.current = null;
          connectFinalizeRef.current = null;
          connectPromiseRef.current = null;
          resolve(result);
        };

        connectResolveRef.current = finalizeConnect;
        connectFinalizeRef.current = finalizeConnect;

        open({ view: 'Connect' }).catch(() => {
          if (connectResolveRef.current) {
            finalizeConnect(null);
          }
        });

        connectTimeoutRef.current = setTimeout(() => {
          if (connectResolveRef.current) {
            finalizeConnect(null);
          }
        }, 300000);
      });
      const connectedAccount = await connectPromiseRef.current;

      if (connectedAccount && user && user._id && !user.walletAddress) {
        await linkWalletWithUser(connectedAccount, user);
      }

      if (connectedAccount) {
        try {
          await ensureTargetNetwork();
        } catch (networkError) {
          console.error(
            '[connectWallet] Failed to ensure target network:',
            networkError,
          );
        }
      }

      return connectedAccount;
    } catch (e) {
      console.error('[connectWallet] Exception during connectWallet process:', e);
      return null;
    }
  }, [isConnected, address, user, open, ensureTargetNetwork]);

  const switchNetwork = useCallback(async () => {
    try {
      await ensureTargetNetwork();
    } catch (switchError) {
      console.error('[switchNetwork] Error switching network:', switchError);
      setError(switchError);
    }
  }, [ensureTargetNetwork]);

  return (
    <WalletStateContext.Provider
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
        balanceNativeAvailable,
        proofOfPresence,
        bookedDates,
        error,
        library,
        chainId,
      }}
    >
      <WalletDispatchContext.Provider
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
      </WalletDispatchContext.Provider>
    </WalletStateContext.Provider>
  );
};

export const WalletProviderWithReown = ({ children }) => (
  <WalletProviderInner>{children}</WalletProviderInner>
);
