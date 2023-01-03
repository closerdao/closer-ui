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
import { fetcher, formatBigNumberForDisplay } from '../../utils/blockchain';
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
    injected.isAuthorized().then((isAuthorized) => {
      if (!isAuthorized) return;
      activate(injected, undefined, true).catch((error) => {
        setError(error);
      });
    });
  }, []);

  const [isWalletReady, setIsWalletReady] = useState(false);
  useEffect(() => {
    if (chainId) {
      setIsWalletReady(BLOCKCHAIN_NETWORK_ID === chainId);
    }
  }, [chainId]);

  const isCorrectNetwork = BLOCKCHAIN_NETWORK_ID === chainId;
  // const hasSameConnectedAccount = user?.walletAddress
  //   ? account === user?.walletAddress
  //   : true;

  useEffect(() => {
    const { ethereum } = window;
    // if (ethereum && !isWalletConnected && !error) {
    const handleConnect = () => {
      console.log('Handling "connect" event');
      if (!isWalletConnected) {
        activate(injected);
      }
    };
    // const handleChainChanged = (newChainId) => {
    //   console.log('Handling "chainChanged" event with payload', newChainId);
    //   if (!isWalletConnected) {
    //     activate(injected);
    //   }
    // };
    const handleAccountsChanged = async ([newAccount]) => {
      console.log('Handling "accountsChanged" event with payload', newAccount);
      // if (!user.walletAddress) {
      //   console.log('calling /auth/web3/pre-sign with account:', newAccount);
      //   const user = await linkWalletWithUser(newAccount);
      //   console.log('user wallet updated on the backend', user);
      // }
    };
    const handleNetworkChanged = (networkId) => {
      setIsWalletReady(BLOCKCHAIN_NETWORK_ID === Number(networkId));
      activate(injected);
    };

    ethereum?.on('connect', handleConnect);
    // ethereum?.on('chainChanged', handleChainChanged);
    ethereum?.on('accountsChanged', handleAccountsChanged);
    ethereum?.on('networkChanged', handleNetworkChanged);

    return () => {
      ethereum?.removeListener('connect', handleConnect);
      // ethereum?.removeListener('chainChanged', handleChainChanged);
      ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      ethereum?.removeListener('networkChanged', handleNetworkChanged);
    };
    // }
  }, [isWalletConnected, error, activate]);

  const { data: balanceDAOToken, mutate: updateWalletBalance } = useSWR(
    [BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
      fallbackData: BigNumber.from(0),
    },
  );
  const { data: balanceStaked } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'unlockedStake', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );
  const { data: unlockedStake } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'unlockedStake', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const balanceTotal = formatBigNumberForDisplay(
    balanceDAOToken.add(balanceStaked),
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceAvailable = formatBigNumberForDisplay(
    balanceDAOToken.add(unlockedStake),
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
  };

  const linkWalletWithUser = async (accountId) => {
    const {
      data: { nonce },
    } = await api.post('/auth/web3/pre-sign', { walletAddress: accountId });
    const message = `Signing in with code ${nonce}`;
    const signedMessage = await signMessage(message);
    const {
      data: { results: userUpdated },
    } = await api.post('/auth/web3/connect', {
      signedMessage,
      walletAddress: accountId,
      message,
      userId: user._id,
    });
    return userUpdated;
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

  const signMessage = async (msg) => {
    try {
      const signedMessage = await library.provider.request({
        method: 'personal_sign',
        params: [msg, account],
      });
      return signedMessage;
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  return (
    <WalletState.Provider
      value={{
        isWalletReady,
        balanceTotal,
        balanceAvailable,
        isCorrectNetwork,
        isWalletConnected,
      }}
    >
      <WalletDispatch.Provider
        value={{ signMessage, switchNetwork, connectWallet }}
      >
        {children}
      </WalletDispatch.Provider>
    </WalletState.Provider>
  );
};
