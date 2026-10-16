import { useRef } from 'react';

import { Contract, providers, utils } from 'ethers';
import useSWR from 'swr';

import { useAuth } from '../contexts/auth';
import type { Stay } from '../types/stay';
import api from '../utils/api';
import { useConfig } from './useConfig';

type BalanceKey = [string, string, number, string, string, string];

async function readBalance(
  _key: string,
  rpcUrl: string,
  chainId: number,
  tokenAddress: string,
  stakingAddress: string,
  walletAddress: string,
): Promise<string> {
  const provider = new providers.JsonRpcProvider(
    { url: rpcUrl, timeout: 15000 },
    chainId,
  );
  const token = new Contract(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)'],
    provider,
  );
  const staking = new Contract(
    stakingAddress,
    ['function unlockedStake(address) view returns (uint256)'],
    provider,
  );
  // Both terms describe the same chain state. No signer or connected wallet is needed.
  const blockTag = await provider.getBlockNumber();
  const [balance, unlocked] = await Promise.all([
    token.balanceOf(walletAddress, { blockTag }),
    staking.unlockedStake(walletAddress, { blockTag }),
  ]);
  return balance.add(unlocked).toString();
}

/** The booking owner's available TDF, independent of the connected wallet. */
export function useStayTokenBalance(
  stay: Pick<Stay, 'createdBy'>,
  enabled: boolean,
) {
  const { user } = useAuth();
  const config = useConfig();
  const ownerId = stay.createdBy || user?._id;
  const isOwner = ownerId === user?._id;
  const {
    data: ownerWallet,
    error: ownerError,
    mutate: refreshOwner,
  } = useSWR(
    enabled && user?._id && ownerId && !isOwner
      ? ['stay-owner-wallet', user._id, ownerId]
      : null,
    async (_key, _viewerId, id) => {
      const { data } = await api.get(`/user/${id}`, {
        params: { fields: 'walletAddress' },
      });
      return String(data?.results?.walletAddress || '');
    },
    { shouldRetryOnError: false },
  );
  const address = isOwner ? user?.walletAddress : ownerWallet;
  const walletAddress =
    address && utils.isAddress(address) ? utils.getAddress(address) : null;
  const rpcUrl = config?.BLOCKCHAIN_RPC_URL;
  const chainId = Number(config?.BLOCKCHAIN_NETWORK_ID);
  const tokenAddress = config?.BLOCKCHAIN_DAO_TOKEN?.address;
  const stakingAddress = config?.BLOCKCHAIN_DAO_DIAMOND_ADDRESS;
  const key: BalanceKey | null =
    enabled &&
    walletAddress &&
    rpcUrl &&
    chainId &&
    tokenAddress &&
    stakingAddress
      ? [
          'stay-profile-token-balance',
          rpcUrl,
          chainId,
          tokenAddress,
          stakingAddress,
          walletAddress,
        ]
      : null;
  const scope = JSON.stringify(key);
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const { data, error, isValidating, mutate } = useSWR<string>(
    key,
    readBalance,
    {
      shouldRetryOnError: false,
    },
  );
  const refresh = async () => {
    if (!key) throw new Error('Profile token balance is unavailable.');
    const balance = await mutate(readBalance(...key), false);
    if (scope !== currentScope.current)
      throw new Error('The booking wallet changed. Please try again.');
    if (balance == null)
      throw new Error('Profile token balance is unavailable.');
    return balance;
  };
  const isOwnerLoading =
    enabled &&
    !!ownerId &&
    !isOwner &&
    ownerWallet === undefined &&
    !ownerError;
  return {
    walletAddress,
    balanceWei: key && !error && !ownerError ? (data ?? null) : null,
    isLoading:
      isOwnerLoading || (!!key && data === undefined && !error) || isValidating,
    error: ownerError || error,
    refresh,
    retry: async () => (ownerError ? refreshOwner() : refresh()),
  };
}
