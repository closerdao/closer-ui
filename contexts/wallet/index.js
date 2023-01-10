import React, { createContext, useEffect, useState } from 'react';

import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  InjectedConnector,
  NoEthereumProviderError,
  UserRejectedRequestError,
} from '@web3-react/injected-connector';
import { BigNumber, utils } from 'ethers';
import useSWR from 'swr';

import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_EXPLORER_URL,
  BLOCKCHAIN_NAME,
  BLOCKCHAIN_NATIVE_TOKEN,
  BLOCKCHAIN_NETWORK_ID,
  BLOCKCHAIN_RPC_URL,
} from '../../config_blockchain';
import api from '../../utils/api';
import {
  fetcher,
  formatBigNumberForDisplay,
  multiFetcher,
} from '../../utils/blockchain';
import { useAuth } from '../auth';

export const WalletState = createContext();
export const WalletDispatch = createContext();

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
    if (user && !isWalletConnected) {
      injected.isAuthorized().then((isAuthorized) => {
        if (!isAuthorized) return;
        connectWallet();
      });
    }
  }, [user]);

  const [isWalletReady, setIsWalletReady] = useState(false);
  const isCorrectNetwork = BLOCKCHAIN_NETWORK_ID === chainId;
  const hasSameConnectedAccount = user?.walletAddress
    ? account === user?.walletAddress
    : true;

  useEffect(() => {
    setIsWalletReady(
      isWalletConnected && isCorrectNetwork && hasSameConnectedAccount,
    );
  }, [chainId, isWalletConnected, account, error]);

  const { data: balanceDAOToken, mutate: updateWalletBalance } = useSWR(
    [BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: lockedStake } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'lockedStake', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: activatedBookingYears } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'getAccommodationYears'],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );
  const { data: bookedDates, mutate: refetchBookingDates } = useSWR(
    [
      activatedBookingYears
        ? activatedBookingYears.map(([year]) => [
            BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
            'getAccommodationBookings',
            account,
            year,
          ])
        : null,
    ],
    {
      fetcher: multiFetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  const proofOfPresence = bookedDates
    ?.flat()
    .filter((date) => date.status === 2).length;

  const balanceTotal = formatBigNumberForDisplay(
    balanceDAOToken.add(lockedStake),
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceAvailable = formatBigNumberForDisplay(
    balanceDAOToken,
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );

  const connectWallet = async () => {
    await activate(
      injected,
      async (error) => {
        if (error instanceof UserRejectedRequestError) {
          // ignore user rejected error
        } else if (
          error instanceof UnsupportedChainIdError &&
          window.ethereum
        ) {
          //Unrecognized chain, provider not loaded, attempting hard forced chain change if metamask is injected
          switchNetwork(window.ethereum);
        } else if (error instanceof NoEthereumProviderError) {
          alert(
            'You need to install and activate an Ethereum compatible wallet',
          );
        } else {
          setError(error);
        }
      },
      false,
    );
    if (!user?.walletAddress) {
      if (account) {
        await linkWalletWithUser(account);
      } else {
        const activated = await injected.activate();
        await linkWalletWithUser(activated?.account);
      }
    }
  };

  const linkWalletWithUser = async (accountId) => {
    try {
      const {
        data: { nonce },
      } = await api.post('/auth/web3/pre-sign', { walletAddress: accountId });
      const message = `Signing in with code ${nonce}`;
      const signedMessage = await signMessage(message, accountId);
      const {
        data: { results: userUpdated },
      } = await api.post('/auth/web3/connect', {
        signedMessage,
        walletAddress: accountId,
        message,
        userId: user._id,
      });
      return userUpdated;
    } catch (error) {
      console.error(error);
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
        account,
        library,
        injected,
        isWalletReady,
        balanceTotal,
        balanceAvailable,
        proofOfPresence,
        isCorrectNetwork,
        isWalletConnected,
        bookedDates: bookedDates?.flat(),
        hasSameConnectedAccount,
      }}
    >
      <WalletDispatch.Provider
        value={{
          signMessage,
          switchNetwork,
          connectWallet,
          updateWalletBalance,
          refetchBookingDates,
        }}
      >
        {children}
      </WalletDispatch.Provider>
    </WalletState.Provider>
  );
};
