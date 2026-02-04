import { useEffect, useState } from 'react';

import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  InjectedConnector,
  NoEthereumProviderError,
  UserRejectedRequestError,
} from '@web3-react/injected-connector';
import { BigNumber, utils } from 'ethers';
import useSWR from 'swr';

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
  BLOCKCHAIN_EXPLORER_URL,
  BLOCKCHAIN_NAME,
  BLOCKCHAIN_NATIVE_TOKEN,
  BLOCKCHAIN_NETWORK_ID,
  BLOCKCHAIN_RPC_URL,
  BLOCKCHAIN_CEUR_TOKEN,
  BLOCKCHAIN_CELO_TOKEN,
  BLOCKCHAIN_PRESENCE_ABI,
  BLOCKCHAIN_PRESENCE_TOKEN,
} = blockchainConfig;

const injected = new InjectedConnector({
  supportedChainIds: [
    ...new Set([
      BLOCKCHAIN_NETWORK_ID,
      1,
      3,
      4,
      5,
      10,
      42,
      137,
      420,
      42220,
      42161,
      44787,
      80001,
      421611,
    ]),
  ],
});

export const WalletProvider = ({ children }) => {
  const {
    active: isWalletConnected,
    account,
    activate,
    setError,
    error,
    library,
    chainId,
  } = useWeb3React();
  const { user } = useAuth();

  useEffect(() => {
    if (
      user &&
      !isWalletConnected &&
      process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true'
    ) {
      injected.isAuthorized().then((isAuthorized) => {
        if (!isAuthorized) return;
        connectWallet();
      });
    }
  }, [user]);

  const [isWalletReady, setIsWalletReady] = useState(false);
  const isCorrectNetwork = BLOCKCHAIN_NETWORK_ID === chainId;
  const hasSameConnectedAccount =
    user?.walletAddress?.toLowerCase() === account?.toLowerCase();

  useEffect(() => {
    setIsWalletReady(
      isWalletConnected && isCorrectNetwork && hasSameConnectedAccount,
    );
  }, [chainId, isWalletConnected, account, error, user?.walletAddress]);

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

  // const { data: activatedBookingYears } = useSWR(
  //   [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'getAccommodationYears'],
  //   {
  //     fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
  //   },
  // );
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

  const connectWallet = async () => {
    console.log('[connectWallet] called');
    try {
      await activate(
        injected,
        async (error) => {
          if (error instanceof UserRejectedRequestError) {
            console.log('[connectWallet] UserRejectedRequestError');
            // ignore user rejected error
          } else if (
            error instanceof UnsupportedChainIdError &&
            window.ethereum
          ) {
            console.log(
              '[connectWallet] UnsupportedChainIdError, switching network',
            );
            switchNetwork(window.ethereum);
          } else if (error instanceof NoEthereumProviderError) {
            console.log('[connectWallet] NoEthereumProviderError');
            alert(
              'You need to install and activate an Ethereum compatible wallet',
            );
          } else {
            console.log('[connectWallet] Other error:', error);
            setError(error);
          }
        },
        false,
      );
      console.log('[connectWallet] main activate finished'); // Changed log message for clarity

      // `user` is from useAuth(), `account` (from useWeb3React) should be updated after activation.
      // The original code called `injected.activate()` again here.
      // This is presumably to reliably get the account details immediately post-activation
      // as useWeb3React state updates might not be synchronous.
      const activatedConnection = await injected.activate();
      const connectedAccount = activatedConnection?.account;
      console.log(
        '[connectWallet] secondary injected.activate() result:',
        activatedConnection,
      );

      if (user && user._id && !user.walletAddress && connectedAccount) {
        // User is logged in, doesn't have a wallet linked, and a wallet is now connected.
        console.log(
          `[connectWallet] User ${user._id} authenticated, no wallet linked. Wallet ${connectedAccount} connected. Attempting to link.`,
        );
        await linkWalletWithUser(connectedAccount, user);
      } else {
        // Log reasons why linking is not happening
        if (!user || !user._id) {
          console.log(
            '[connectWallet] No authenticated user (or user missing _id). Wallet may be connected, but not linking to a user profile at this stage.',
          );
        } else if (user && user.walletAddress) {
          console.log(
            `[connectWallet] User ${user._id} already has wallet ${user.walletAddress} linked.`,
          );
        } else if (!connectedAccount) {
          console.log(
            '[connectWallet] Wallet connection via secondary injected.activate() did not yield an account. Cannot link.',
          );
        }
      }

      console.log('[connectWallet] finished successfully, returning account:', connectedAccount);
      return connectedAccount;
    } catch (e) {
      console.log('[connectWallet] Exception during connectWallet process:', e);
      console.log('[connectWallet] finished with error, returning null');
      return null;
    }
  };

  const linkWalletWithUser = async (accountId, currentUser) => {
    // Added currentUser parameter
    if (!currentUser || !currentUser._id) {
      // Added check for currentUser and currentUser._id
      console.error(
        '[linkWalletWithUser] User object or user._id is not available. Cannot link wallet.',
      );
      return null;
    }
    if (!accountId) {
      // Added check for accountId
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
        // Added check for signedMessage
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
      // TODO: Consider if auth context needs explicit update here, e.g., by calling auth.updateUser(userUpdated);
      return userUpdated;
    } catch (error) {
      console.error(
        '[linkWalletWithUser] Error during API call to link wallet:',
        error,
      );
      return null;
    }
  };

  const switchNetwork = async () => {
    try {
      await library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: utils.hexlify(BLOCKCHAIN_NETWORK_ID) }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: utils.hexlify(BLOCKCHAIN_NETWORK_ID),
                rpcUrls: [BLOCKCHAIN_RPC_URL],
                chainName: BLOCKCHAIN_NAME,
                nativeCurrency: BLOCKCHAIN_NATIVE_TOKEN,
                blockExplorerUrls: [BLOCKCHAIN_EXPLORER_URL],
              },
            ],
          });
        } catch (error) {
          setError(error);
        }
      }
    }
  };

  const signMessage = async (msg, accountId) => {
    let provider;
    if (!library) {
      provider = await injected.getProvider();
    } else {
      provider = library.provider;
    }
    try {
      const signedMessage = await provider.request({
        method: 'personal_sign',
        params: [msg, accountId],
      });
      return signedMessage;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

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
          signMessage, // Add signMessage here
        }}
      >
        {children}
      </WalletDispatch.Provider>
    </WalletState.Provider>
  );
};
