import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseEther, formatEther, createPublicClient, http, encodeFunctionData } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';

import { WalletState } from '../contexts/wallet';
import { useConfig } from './useConfig';

const dataSuffix = getDataSuffix({
  consumer: '0x9B5f6dF2C7A331697Cf2616CA884594F6afDC07d',
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca',
    '0xc95876688026be9d6fa7a7c33328bd013effa2bb',
    '0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8',
  ],
});

const RPC_ENDPOINTS = {
  celo: [
    'https://forno.celo.org',
    'https://rpc.ankr.com/celo',
    'https://celo-mainnet.public.blastapi.io',
  ],
  alfajores: [
    'https://alfajores-forno.celo-testnet.org',
    'https://celo-alfajores.infura.io',
  ],
};

const CACHE_TTL = 30000;

const publicClientCache = new Map<string, ReturnType<typeof createPublicClient>>();
const getCurrentSupplyWithoutWalletCallInProgress = new Map<string, Promise<number>>();
const getCurrentSupplyWithoutWalletResultCache = new Map<string, { result: number; timestamp: number }>();
const getTokensAvailableForPurchaseCallInProgress = new Map<string, Promise<number>>();
const getTokensAvailableForPurchaseResultCache = new Map<string, { result: number; timestamp: number }>();

const getReadOnlyPublicClient = (network: string) => {
  if (publicClientCache.has(network)) {
    return publicClientCache.get(network)!;
  }

  const chain = network === 'celo' ? celo : celoAlfajores;
  const endpoints = RPC_ENDPOINTS[network as keyof typeof RPC_ENDPOINTS];

  const client = createPublicClient({
    chain,
    transport: http(endpoints[0]),
  });

  publicClientCache.set(network, client);
  return client;
};

export const useBuyTokens = () => {
  const { account } = useContext(WalletState);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const {
    BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
    BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DAO_TOKEN_ABI,
    CEUR_TOKEN_ADDRESS,
  } = useConfig() || {};

  const tokenAddress = BLOCKCHAIN_DAO_TOKEN?.address;
  const [isPending, setPending] = useState(false);
  const [isConfigReady, setIsConfigReady] = useState(false);

  useEffect(() => {
    if (tokenAddress && BLOCKCHAIN_DAO_TOKEN_ABI) {
      setIsConfigReady(true);
    }
  }, [tokenAddress, BLOCKCHAIN_DAO_TOKEN_ABI]);

  const getCurrentSupply = async (): Promise<number> => {
    if (!publicClient || !tokenAddress) return 0;

    try {
      const supplyInWei = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: BLOCKCHAIN_DAO_TOKEN_ABI,
        functionName: 'totalSupply',
      }) as bigint;

      return parseInt(formatEther(supplyInWei));
    } catch (error) {
      console.log(error);
      return 0;
    }
  };

  const getCurrentSupplyWithoutWallet = useCallback(async (): Promise<number> => {
    if (!tokenAddress || !BLOCKCHAIN_DAO_TOKEN_ABI) {
      console.debug('Config not yet initialized');
      return 0;
    }

    const cacheKey = tokenAddress.toLowerCase();
    const cached = getCurrentSupplyWithoutWalletResultCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.debug('getCurrentSupplyWithoutWallet: returning cached result');
      return cached.result;
    }

    if (getCurrentSupplyWithoutWalletCallInProgress.has(cacheKey)) {
      console.debug('getCurrentSupplyWithoutWallet already in progress, returning existing promise');
      return getCurrentSupplyWithoutWalletCallInProgress.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        setPending(true);

        const network = process.env.NEXT_PUBLIC_NETWORK || 'alfajores';
        const readOnlyClient = getReadOnlyPublicClient(network);

        const code = await readOnlyClient.getCode({
          address: tokenAddress as `0x${string}`,
        });

        if (!code || code === '0x') {
          console.warn('Token contract not found at specified address');
          const result = 0;
          getCurrentSupplyWithoutWalletResultCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }

        try {
          const supplyInWei = await readOnlyClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: BLOCKCHAIN_DAO_TOKEN_ABI,
            functionName: 'totalSupply',
          }) as bigint;

          const supply = parseInt(formatEther(supplyInWei));
          getCurrentSupplyWithoutWalletResultCache.set(cacheKey, { result: supply, timestamp: Date.now() });
          return supply;
        } catch (contractError) {
          console.error('Contract call failed:', contractError);
          const result = 0;
          getCurrentSupplyWithoutWalletResultCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      } catch (error) {
        console.error('Error in getCurrentSupplyWithoutWallet:', error);
        const result = 0;
        getCurrentSupplyWithoutWalletResultCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      } finally {
        setPending(false);
        getCurrentSupplyWithoutWalletCallInProgress.delete(cacheKey);
      }
    })();

    getCurrentSupplyWithoutWalletCallInProgress.set(cacheKey, promise);
    return promise;
  }, [tokenAddress, BLOCKCHAIN_DAO_TOKEN_ABI]);

  const getUserTdfBalance = async (): Promise<number> => {
    if (!publicClient || !tokenAddress || !account) return 0;

    try {
      const balanceInWei = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: BLOCKCHAIN_DAO_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [account as `0x${string}`],
      }) as bigint;

      return parseInt(formatEther(balanceInWei));
    } catch (error) {
      console.log(error);
      return 0;
    }
  };

  const getTokensAvailableForPurchase = async (): Promise<number> => {
    if (!BLOCKCHAIN_DAO_TOKEN?.address || !BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS) {
      return 0;
    }

    const cacheKey = `${BLOCKCHAIN_DAO_TOKEN.address.toLowerCase()}-${BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS.toLowerCase()}`;
    const cached = getTokensAvailableForPurchaseResultCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.debug('getTokensAvailableForPurchase: returning cached result');
      return cached.result;
    }

    if (getTokensAvailableForPurchaseCallInProgress.has(cacheKey)) {
      console.debug('getTokensAvailableForPurchase already in progress, returning existing promise');
      return getTokensAvailableForPurchaseCallInProgress.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        if (!publicClient) {
          const result = 0;
          getTokensAvailableForPurchaseResultCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }

        const supply = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: BLOCKCHAIN_DAO_TOKEN_ABI,
          functionName: 'totalSupply',
        }) as bigint;

        const saleCap = await publicClient.readContract({
          address: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS as `0x${string}`,
          abi: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
          functionName: 'saleHardCap',
        }) as bigint;

        const remainingTokens = saleCap - supply;
        const result = parseInt(formatEther(remainingTokens));
        getTokensAvailableForPurchaseResultCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      } catch (error) {
        console.log(error);
        const result = 0;
        getTokensAvailableForPurchaseResultCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      } finally {
        getTokensAvailableForPurchaseCallInProgress.delete(cacheKey);
      }
    })();

    getTokensAvailableForPurchaseCallInProgress.set(cacheKey, promise);
    return promise;
  };

  const buyTokens = async (amount: string) => {
    if (!walletClient || !publicClient || !BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS) {
      return { error: new Error('Wallet not connected'), success: false, txHash: null };
    }

    const amountInWei = parseEther(amount);

    try {
      setPending(true);

      const txData = encodeFunctionData({
        abi: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
        functionName: 'buy',
        args: [amountInWei],
      });

      const fullData = `${txData}${dataSuffix.slice(2)}` as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        to: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS as `0x${string}`,
        data: fullData,
        account: walletClient.account!,
        chain: walletClient.chain,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const success = receipt.status === 'success';

      if (chainId !== 44787) {
        try {
          await submitReferral({
            txHash: hash,
            chainId,
          });
        } catch (error) {
          console.error('submitReferral error:', error);
        }
      }

      return {
        error: success ? null : new Error('reverted'),
        success,
        txHash: hash,
      };
    } catch (error) {
      console.error('buyTokens', error);
      return {
        error,
        success: false,
        txHash: null,
      };
    } finally {
      setPending(false);
    }
  };

  const getTotalCost = async (amount: string): Promise<number> => {
    if (!publicClient || !BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS) return 0;

    const amountInWei = parseEther(amount);

    const result = await publicClient.readContract({
      address: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS as `0x${string}`,
      abi: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
      functionName: 'calculateTotalCost',
      args: [amountInWei],
    });

    if (typeof result === 'bigint') {
      return parseFloat(formatEther(result));
    }
    
    const resultObj = result as { totalCost?: bigint };
    if (resultObj.totalCost !== undefined) {
      return parseFloat(formatEther(resultObj.totalCost));
    }

    return 0;
  };

  const getTotalCostWithoutWallet = async (amount: string): Promise<number> => {
    try {
      setPending(true);

      if (!BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS || !BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI) {
        console.debug('Config not yet initialized for dynamic sale contract');
        return 0;
      }

      const network = process.env.NEXT_PUBLIC_NETWORK || 'alfajores';
      const readOnlyClient = getReadOnlyPublicClient(network);

      const amountInWei = parseEther(amount);

      const result = await readOnlyClient.readContract({
        address: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS as `0x${string}`,
        abi: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
        functionName: 'calculateTotalCost',
        args: [amountInWei],
      });

      if (typeof result === 'bigint') {
        return parseFloat(formatEther(result));
      }
      
      const resultObj = result as { totalCost?: bigint };
      if (resultObj.totalCost !== undefined) {
        return parseFloat(formatEther(resultObj.totalCost));
      }

      return 0;
    } catch (error) {
      console.error('Error in getTotalCostWithoutWallet:', error);
      return 0;
    } finally {
      setPending(false);
    }
  };

  const isCeurApproved = async (tdfAmount: string): Promise<boolean> => {
    if (!publicClient || !account || !BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS || !CEUR_TOKEN_ADDRESS) {
      return false;
    }

    const amountInWei = parseEther(tdfAmount);

    const result = await publicClient.readContract({
      address: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS as `0x${string}`,
      abi: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
      functionName: 'calculateTotalCost',
      args: [amountInWei],
    });

    let totalCost: bigint;
    if (typeof result === 'bigint') {
      totalCost = result;
    } else {
      const resultObj = result as { totalCost?: bigint };
      totalCost = resultObj.totalCost ?? BigInt(0);
    }

    const allowance = await publicClient.readContract({
      address: CEUR_TOKEN_ADDRESS as `0x${string}`,
      abi: BLOCKCHAIN_DAO_TOKEN_ABI,
      functionName: 'allowance',
      args: [account as `0x${string}`, BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS as `0x${string}`],
    }) as bigint;

    return allowance >= totalCost;
  };

  const approveCeur = async (amount: number) => {
    if (!walletClient || !publicClient || !CEUR_TOKEN_ADDRESS || !BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS) {
      return { error: new Error('Wallet not connected'), success: false, txHash: null };
    }

    const bufferFactor = 1.05;
    const approvalAmount = parseEther((bufferFactor * amount).toString());

    try {
      setPending(true);

      const hash = await walletClient.writeContract({
        address: CEUR_TOKEN_ADDRESS as `0x${string}`,
        abi: BLOCKCHAIN_DAO_TOKEN_ABI,
        functionName: 'approve',
        args: [BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS as `0x${string}`, approvalAmount],
        account: walletClient.account!,
        chain: walletClient.chain,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (chainId !== 44787) {
        try {
          await submitReferral({
            txHash: hash,
            chainId,
          });
        } catch (error) {
          console.error('submitReferral error:', error);
        }
      }

      const success = receipt.status === 'success';
      return {
        error: success ? null : new Error('reverted'),
        success,
        txHash: hash,
      };
    } catch (error) {
      console.error('approveCeur', error);
      return {
        error,
        success: false,
        txHash: null,
      };
    } finally {
      setPending(false);
    }
  };

  return {
    getCurrentSupply,
    getCurrentSupplyWithoutWallet,
    buyTokens,
    getTokensAvailableForPurchase,
    getTotalCost,
    getTotalCostWithoutWallet,
    getUserTdfBalance,
    isCeurApproved,
    approveCeur,
    isPending,
    isConfigReady,
  };
};
