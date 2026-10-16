import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Web3Provider } from '@ethersproject/providers';
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
} from '@reown/appkit/react';
import { BigNumber } from 'ethers';
import useSWR from 'swr';

import { appKit, appKitReady, celoMainnet, celoSepolia } from '../../appkit';
import { blockchainConfig } from '../../config_blockchain';
import { walletNonce } from '../../utils/auth';
import {
  fetcher,
  formatBigNumberForDisplay,
  multiFetcher,
} from '../../utils/blockchain';
import { trackEvent } from '../../utils/posthog';
import { linkWallet } from '../../utils/user';
import { fetchMe } from '../../utils/users';
import { useAuth } from '../auth';
import { WalletFlowError, createWalletConnection } from './connection';

export const walletRuntimeReady = appKitReady;

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

// This component never wraps the page: loading it cannot remount forms.
export const WalletProviderWithReown = ({ publish }) => {
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' });
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');
  const { open: isAppKitModalOpen } = useAppKitState();
  const { user, setUser } = useAuth();
  const [connectionError, setError] = useState(null);
  const [connectionStage, setConnectionStage] = useState('idle');
  const [networkStatus, setNetworkStatus] = useState('idle');
  const isWalletSwitchingNetwork = networkStatus === 'switching';
  const error = useMemo(
    () =>
      networkStatus === 'failed'
        ? new WalletFlowError('network_failed')
        : connectionError,
    [networkStatus, connectionError],
  );
  const latest = useRef({ user, setUser });
  latest.current = { user, setUser };
  const connection = useRef(null);
  const networkRequest = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const flow = createWalletConnection({
      getUser: () => latest.current.user,
      setUser: (updated) => latest.current.setUser(updated),
      getWallet: () => {
        const current = appKit.getAccount('eip155');
        return {
          account: current.address,
          isConnected: current.isConnected,
          provider: appKit.getWalletProvider(),
          chainId: appKit.getChainId(),
        };
      },
      open: () => appKit.open({ view: 'Connect', namespace: 'eip155' }),
      subscribe: (changed, failed, selected) => {
        const unsubscribers = [
          appKit.subscribeAccount(changed, 'eip155'),
          appKit.subscribeProviders(changed),
          appKit.subscribeEvents(({ data }) => {
            if (
              data.event === 'CONNECT_ERROR' ||
              data.event === 'USER_REJECTED'
            )
              failed();
            if (data.event === 'SELECT_WALLET') selected(data.properties?.name);
          }),
        ];
        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
      },
      api: {
        walletNonce,
        linkWallet,
        fetchMe: () => fetchMe({ fresh: true }),
      },
      onStage: setConnectionStage,
      onError: setError,
      track: trackEvent,
    });
    connection.current = flow;
    return () => {
      mounted.current = false;
      flow.dispose();
    };
  }, []);

  useEffect(() => {
    connection.current?.cancelWalletConnection();
  }, [user?._id]);

  useEffect(() => {
    setNetworkStatus('idle');
    networkRequest.current = null;
    return () => {
      networkRequest.current = null;
    };
  }, [walletProvider, isConnected]);

  // After a failed switch, changing networks in the wallet can also recover.
  // Ordinary connections and network changes remain managed by AppKit.
  useEffect(() => {
    if (networkStatus !== 'failed' || !walletProvider?.on) return;
    let active = true;
    let verification = 0;
    const verifyNetwork = async () => {
      const current = ++verification;
      try {
        const actualChain = await walletProvider.request({
          method: 'eth_chainId',
        });
        if (
          active &&
          current === verification &&
          !networkRequest.current &&
          appKit.getWalletProvider() === walletProvider &&
          Number(actualChain) === Number(BLOCKCHAIN_NETWORK_ID)
        )
          setNetworkStatus('idle');
      } catch {
        // Keep the failure and retry action until the wallet confirms the chain.
      }
    };
    walletProvider.on('chainChanged', verifyNetwork);
    return () => {
      active = false;
      walletProvider.removeListener?.('chainChanged', verifyNetwork);
    };
  }, [walletProvider, networkStatus]);

  const connectWallet = useCallback(
    () => connection.current?.connectWallet() ?? Promise.resolve(null),
    [],
  );
  const cancelWalletConnection = useCallback(
    () => connection.current?.cancelWalletConnection(),
    [],
  );
  const getConnectedAccount = useCallback(
    () => connection.current?.getConnectedAccount() ?? null,
    [],
  );
  const signMessage = useCallback(
    (message, accountId) =>
      connection.current?.signMessage(message, accountId) ??
      Promise.resolve(null),
    [],
  );
  const selectWallet = useCallback(async () => {
    try {
      await appKit.open({ view: 'Connect', namespace: 'eip155' });
    } catch {
      setError(new WalletFlowError('connection_failed'));
    }
  }, []);
  const switchNetwork = useCallback(() => {
    if (networkRequest.current) return networkRequest.current;
    const provider = appKit.getWalletProvider();
    setNetworkStatus('switching');
    setError(null);
    const isCurrent = () =>
      mounted.current &&
      networkRequest.current === request &&
      appKit.getWalletProvider() === provider;
    const request = Promise.resolve()
      .then(async () => {
        if (!isCurrent()) return;
        if (!provider?.request) throw new WalletFlowError('network_failed');
        const target =
          Number(BLOCKCHAIN_NETWORK_ID) === 11142220
            ? celoSepolia
            : celoMainnet;
        await appKit.switchNetwork(target, { throwOnFailure: true });
        if (!isCurrent()) return;
        const actualChain = await provider.request({ method: 'eth_chainId' });
        if (!isCurrent()) return;
        if (Number(actualChain) !== Number(target.id)) {
          // AppKit can add a missing chain without the wallet selecting it.
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${Number(target.id).toString(16)}` }],
          });
          if (!isCurrent()) return;
          const switchedChain = await provider.request({
            method: 'eth_chainId',
          });
          if (Number(switchedChain) !== Number(target.id))
            throw new WalletFlowError('network_failed');
        }
        if (isCurrent()) setNetworkStatus('idle');
      })
      .catch(() => {
        if (isCurrent()) setNetworkStatus('failed');
      })
      .finally(() => {
        if (networkRequest.current === request) networkRequest.current = null;
      });
    networkRequest.current = request;
    return request;
  }, []);

  const account = address || null;
  const isWalletConnected = Boolean(isConnected && account && walletProvider);
  const isCorrectNetwork =
    networkStatus === 'idle' &&
    Number(BLOCKCHAIN_NETWORK_ID) === Number(chainId);
  const hasSameConnectedAccount = Boolean(
    account &&
    user?.walletAddress &&
    user.walletAddress.toLowerCase() === account.toLowerCase(),
  );
  const isWalletReady =
    isWalletConnected && isCorrectNetwork && hasSameConnectedAccount;
  useEffect(() => {
    if (
      isWalletConnected &&
      hasSameConnectedAccount &&
      connectionError?.code === 'account_mismatch'
    )
      setError(null);
  }, [isWalletConnected, hasSameConnectedAccount, connectionError]);
  const library = useMemo(
    () => (walletProvider ? new Web3Provider(walletProvider, 'any') : null),
    [walletProvider, chainId],
  );
  const canRead = Boolean(library && isWalletConnected && isCorrectNetwork);
  const {
    data: balanceDAOToken,
    error: balanceDAOTokenError,
    mutate: updateWalletBalance,
  } = useSWR(
    canRead && account
      ? [chainId, BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: (_chain, ...args) =>
        fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI)(...args),
      fallbackData: null,
    },
  );

  const { data: balanceCeurToken, mutate: updateCeurBalance } = useSWR(
    canRead && account
      ? [chainId, BLOCKCHAIN_CEUR_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: (_chain, ...args) =>
        fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI)(...args),
      fallbackData: null,
    },
  );

  const { data: balanceCeloToken, mutate: updateCeloBalance } = useSWR(
    canRead && account
      ? [chainId, BLOCKCHAIN_CELO_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: (_chain, ...args) =>
        fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI)(...args),
      fallbackData: null,
    },
  );

  const {
    data: nativeBalance,
    mutate: refreshNativeBalance,
    error: nativeBalanceError,
  } = useSWR(canRead && account ? [chainId, account, 'nativeBalance'] : null, {
    fetcher: (_chain, acc) => library.getBalance(acc),
    fallbackData: null,
  });

  const {
    data: stakedBalanceOf,
    mutate: refreshStakedBalance,
    error: stakedBalanceOfError,
  } = useSWR(
    canRead && account
      ? [chainId, BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'stakedBalanceOf', account]
      : null,
    {
      fetcher: (_chain, ...args) =>
        fetcher(library, BLOCKCHAIN_DIAMOND_ABI)(...args),
      fallbackData: null,
    },
  );

  const {
    data: unlockedStake,
    mutate: refreshUnlockedStake,
    error: unlockedStakeError,
  } = useSWR(
    canRead && account
      ? [chainId, BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'unlockedStake', account]
      : null,
    {
      fetcher: (_chain, ...args) =>
        fetcher(library, BLOCKCHAIN_DIAMOND_ABI)(...args),
      fallbackData: null,
    },
  );

  const { data: balancePresence } = useSWR(
    canRead && account
      ? [chainId, BLOCKCHAIN_PRESENCE_TOKEN.address, 'balanceOf', account]
      : null,
    {
      fetcher: (_chain, ...args) =>
        fetcher(library, BLOCKCHAIN_PRESENCE_ABI)(...args),
      fallbackData: null,
    },
  );

  const { data: activatedBookingYears } = useSWR(
    canRead
      ? [chainId, BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'getAccommodationYears']
      : null,
    {
      fetcher: (_chain, ...args) =>
        fetcher(library, BLOCKCHAIN_DIAMOND_ABI)(...args),
    },
  );
  const { data: bookedDates, mutate: refetchBookingDates } = useSWR(
    canRead && activatedBookingYears && account
      ? [
          chainId,
          activatedBookingYears.map(([year]) => [
            BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
            'getAccommodationBookings',
            account,
            year,
          ]),
        ]
      : null,
    {
      fetcher: (_chain, requests) =>
        multiFetcher(library, BLOCKCHAIN_DIAMOND_ABI)(requests),
    },
  );

  const balanceTotal = formatBigNumberForDisplay(
    (balanceDAOToken || BigNumber.from(0)).add(
      stakedBalanceOf || BigNumber.from(0),
    ),
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceAvailable = formatBigNumberForDisplay(
    (balanceDAOToken || BigNumber.from(0)).add(
      unlockedStake || BigNumber.from(0),
    ),
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceAvailableWei =
    canRead && balanceDAOToken != null && unlockedStake != null
      ? balanceDAOToken.add(unlockedStake).toString()
      : null;
  const balanceCeurAvailableWei =
    canRead && balanceCeurToken != null ? balanceCeurToken.toString() : null;
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

  const balanceError =
    balanceDAOTokenError ||
    nativeBalanceError ||
    stakedBalanceOfError ||
    unlockedStakeError;
  const balancesLoaded = [
    balanceDAOToken,
    nativeBalance,
    stakedBalanceOf,
    unlockedStake,
  ].every((value) => value !== null && value !== undefined);
  const balanceStatus = !canRead
    ? 'idle'
    : balanceError
      ? 'error'
      : balancesLoaded
        ? 'ready'
        : 'loading';
  const refreshBalances = useCallback(
    () =>
      Promise.allSettled([
        updateWalletBalance(),
        updateCeurBalance(),
        updateCeloBalance(),
        refreshNativeBalance(),
        refreshStakedBalance(),
        refreshUnlockedStake(),
      ]),
    [
      updateWalletBalance,
      updateCeurBalance,
      updateCeloBalance,
      refreshNativeBalance,
      refreshStakedBalance,
      refreshUnlockedStake,
    ],
  );
  const state = useMemo(
    () => ({
      initializationStatus: 'ready',
      isWalletInitializing: false,
      initializationSlow: false,
      connectionStage,
      isWalletConnecting: connectionStage !== 'idle',
      isWalletSwitchingNetwork,
      isAppKitModalOpen,
      isWalletConnected,
      isWalletReady,
      isCorrectNetwork,
      hasSameConnectedAccount,
      account,
      balanceTotal,
      balanceAvailable,
      balanceAvailableWei,
      balanceCeurAvailableWei,
      balanceCeurAvailable,
      balanceCeloAvailable,
      balanceNativeAvailable,
      proofOfPresence,
      bookedDates,
      library,
      chainId,
      error,
      balanceStatus,
      balanceError: balanceError ? new WalletFlowError('balance_failed') : null,
      isBalanceLoading: balanceStatus === 'loading',
    }),
    [
      connectionStage,
      isWalletSwitchingNetwork,
      isAppKitModalOpen,
      isWalletConnected,
      isWalletReady,
      isCorrectNetwork,
      hasSameConnectedAccount,
      account,
      balanceTotal,
      balanceAvailable,
      balanceAvailableWei,
      balanceCeurAvailableWei,
      balanceCeurAvailable,
      balanceCeloAvailable,
      balanceNativeAvailable,
      proofOfPresence,
      bookedDates,
      library,
      chainId,
      error,
      balanceStatus,
      balanceError,
    ],
  );
  const dispatch = useMemo(
    () => ({
      connectWallet,
      getConnectedAccount,
      cancelWalletConnection,
      selectWallet,
      signMessage,
      switchNetwork,
      updateWalletBalance,
      updateCeurBalance,
      updateCeloBalance,
      refetchBookingDates,
      refreshBalances,
    }),
    [
      connectWallet,
      getConnectedAccount,
      cancelWalletConnection,
      selectWallet,
      signMessage,
      switchNetwork,
      updateWalletBalance,
      updateCeurBalance,
      updateCeloBalance,
      refetchBookingDates,
      refreshBalances,
    ],
  );
  useEffect(() => {
    publish(state, dispatch);
  }, [state, dispatch, publish]);
  return null;
};
