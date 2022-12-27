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
} from '../config_blockchain';
import { useAuth } from '../contexts/auth';
import { useEagerConnect } from './blockchain';
import api from '../utils/api';
import { fetcher, formatBigNumberForDisplay } from '../utils/blockchain';

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

export const useWallet = () => {
  const {
    active: isWalletConnected,
    account,
    activate,
    setError,
    library,
    chainId,
  } = useWeb3React();
  console.log('useWallet account', account);
  useEagerConnect(injected);

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
  const balanceTotal = formatBigNumberForDisplay(
    balanceDAOToken.add(balanceStaked),
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceAvailable = formatBigNumberForDisplay(
    balanceDAOToken,
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );

  const isCorrectNetwork = BLOCKCHAIN_NETWORK_ID === chainId;
  const hasSameConnectedAccount = account === user.walletAddress;
  const isBlockchainAllowed = isCorrectNetwork && hasSameConnectedAccount;

  const connectWallet = async () => {
    if (isBlockchainAllowed) {
      activate(
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
    } else {
      console.error(
        'Can`t connect wallet, not allowed, isCorrectNetwork - ',
        isCorrectNetwork,
        'hasSameConnectedAccount - ',
        hasSameConnectedAccount,
        'isBlockchainAllowed - ',
        isBlockchainAllowed,
      );
    }
  };

  const { user } = useAuth();
  console.log('useWallet', account, user);

  const connect = async () => {
    // const response = await connectWallet();
    // console.log('connect response', response);
    if (!user.walletAddress) {
      const {
        data: { nonce },
      } = await api.post('/auth/web3/pre-sign', { walletAddress: account });
      const message = `Signing in with code ${nonce}`;
      const signedMessage = await signMessage(message);
      const {
        data: { results: userUpdated },
      } = await api.post('/auth/web3/connect', {
        signedMessage,
        walletAddress: account,
        message,
        userId: user._id,
      });
      console.log('userUpdated', userUpdated);
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

  return {
    balanceAvailable,
    balanceTotal,
    account,
    tokenSymbol: BLOCKCHAIN_DAO_TOKEN.symbol,
    isWalletConnected,
    connect,
    updateWalletBalance,
    signMessage,
    isCorrectNetwork,
    switchNetwork,
  };
};
