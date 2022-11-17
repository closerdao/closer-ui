import Link from 'next/link';

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
import { useEagerConnect } from '../hooks/blockchain_hooks';
import { fetcher, formatBigNumberForDisplay } from '../utils/blockchain';
import { __ } from '../utils/helpers';

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

const ConnectInjected = () => {
  const { chainId, account, activate, setError, active, library } =
    useWeb3React();

  //This hook tries to re-connect automatically a previously connected wallet
  useEagerConnect(injected);

  const onClickConnect = () => {
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
  };

  const switchNetwork = async (provider = library.provider) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: utils.hexlify(BLOCKCHAIN_NETWORK_ID) }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
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

  const { data: balanceDAOToken, mutate: mutateBD } = useSWR(
    [BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: balanceStaked, mutate: mutateSB } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'stakedBalanceOf', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  return (
    <div>
      {active && typeof account === 'string' ? (
        chainId == BLOCKCHAIN_NETWORK_ID ? (
          <Link href="/settings/blockchainwallet">
            <a className="hidden md:flex mr-3">
              <span className="h-12 border-l mr-3" />
              <button className="btn-primary">
                {formatBigNumberForDisplay(
                  balanceDAOToken.add(balanceStaked),
                  BLOCKCHAIN_DAO_TOKEN.decimals,
                ) +
                  ' ' +
                  BLOCKCHAIN_DAO_TOKEN.name}
              </button>
            </a>
          </Link>
        ) : (
          <a className="hidden md:flex mr-3">
            <span className="h-12 border-l mr-3" />
            <button
              className="btn-primary"
              onClick={async () => {
                await switchNetwork();
              }}
            >
              {__('blockchain_switch_chain')}
            </button>
          </a>
        )
      ) : (
        <a className="hidden md:flex mr-3">
          <span className="h-12 border-l mr-3" />
          <button className="btn-primary" onClick={onClickConnect}>
            {__('blockchain_connect_wallet')}
          </button>
        </a>
      )}
    </div>
  );
};

export default ConnectInjected;
