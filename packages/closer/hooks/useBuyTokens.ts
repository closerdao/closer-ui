import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'
import { useCallback, useContext, useEffect, useState } from 'react';
import { Contract, providers, utils } from 'ethers';
import { WalletState } from '../contexts/wallet';
import { useConfig } from './useConfig';

const dataSuffix = getDataSuffix({
  consumer: '0x9B5f6dF2C7A331697Cf2616CA884594F6afDC07d',
  providers: ['0x0423189886d7966f0dd7e7d256898daeee625dca','0xc95876688026be9d6fa7a7c33328bd013effa2bb','0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8'],
})

const RPC_ENDPOINTS: Record<string, string[]> = {
  celo: [
    'https://forno.celo.org',
    'https://rpc.ankr.com/celo',
    'https://celo-mainnet.public.blastapi.io',
  ],
  alfajores: [
    'https://alfajores-forno.celo-testnet.org',
    'https://celo-alfajores.infura.io',
  ],
  celoSepolia: [
    'https://forno.celo-sepolia.celo-testnet.org',
    'https://rpc.ankr.com/celo_sepolia',
  ],
};

const contractInstanceCache = new Map<string, Contract>();
const contractInstancePromises = new Map<string, Promise<Contract>>();
const providerCache = new Map<string, providers.JsonRpcProvider>();
const getCurrentSupplyWithoutWalletCallInProgress = new Map<string, Promise<number>>();
const getCurrentSupplyWithoutWalletResultCache = new Map<string, { result: number; timestamp: number }>();
const getTokensAvailableForPurchaseCallInProgress = new Map<string, Promise<number>>();
const getTokensAvailableForPurchaseResultCache = new Map<string, { result: number; timestamp: number }>();

const CACHE_TTL = 30000;

const getReadOnlyContractInstance = async (address: string, abi: any) => {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'alfajores';
  const abiKey = Array.isArray(abi) ? abi.map((item: any) => item.name || JSON.stringify(item)).join(',') : String(abi);
  const cacheKey = `${network}-${address.toLowerCase()}-${abiKey}`;
  
  if (contractInstanceCache.has(cacheKey)) {
    return contractInstanceCache.get(cacheKey)!;
  }

  if (contractInstancePromises.has(cacheKey)) {
    return contractInstancePromises.get(cacheKey)!;
  }

  const promise = (async () => {
    const endpoints = RPC_ENDPOINTS[network];
    if (!endpoints || !Array.isArray(endpoints)) {
      contractInstancePromises.delete(cacheKey);
      throw new Error(`No RPC endpoints configured for network: ${network}`);
    }
    let workingProvider: providers.JsonRpcProvider | null = null;

    if (providerCache.has(network)) {
      workingProvider = providerCache.get(network)!;
    } else {
      for (const rpcUrl of endpoints) {
        try {
          const provider = new providers.JsonRpcProvider(rpcUrl);
          await provider.getNetwork();
          workingProvider = provider;
          providerCache.set(network, provider);
          break;
        } catch (error) {
          console.warn(`Failed to connect to ${rpcUrl}:`, error);
          continue;
        }
      }
    }

    if (!workingProvider) {
      contractInstancePromises.delete(cacheKey);
      throw new Error(`Unable to connect to any ${network} RPC endpoint`);
    }

    const contract = new Contract(address, abi, workingProvider);
    contractInstanceCache.set(cacheKey, contract);
    contractInstancePromises.delete(cacheKey);
    return contract;
  })();

  contractInstancePromises.set(cacheKey, promise);
  return promise;
};

export const useBuyTokens = () => {
  const walletState = useContext(WalletState);
  const { library, account } = walletState || {};
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

  const getContractInstances = () => {
    if (!BLOCKCHAIN_DAO_TOKEN_ABI || !BLOCKCHAIN_DAO_TOKEN?.address) {
      return null;
    }
    return {
      DynamicSale: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS && BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI
        ? new Contract(
            BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
            BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
            library && library.getUncheckedSigner(),
          )
        : null,
      TdfToken: new Contract(
        BLOCKCHAIN_DAO_TOKEN.address,
        BLOCKCHAIN_DAO_TOKEN_ABI,
        library && library.getUncheckedSigner(),
      ),
      Ceur: CEUR_TOKEN_ADDRESS
        ? new Contract(
            CEUR_TOKEN_ADDRESS,
            BLOCKCHAIN_DAO_TOKEN_ABI,
            library && library.getUncheckedSigner(),
          )
        : null,
    };
  };

  const getCurrentSupply = async () => {
    const contracts = getContractInstances();
    if (!contracts?.TdfToken) {
      console.debug('Contracts not ready');
      return 0;
    }

    try {
      const supplyInWei = await contracts.TdfToken.totalSupply();
      const supply = parseInt(utils.formatEther(supplyInWei));
      return supply;
    } catch (error) {
      console.log(error);
      return 0;
    }
  };

  const getCurrentSupplyWithoutWallet = useCallback(async () => {
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

        const readOnlyTdfToken = await getReadOnlyContractInstance(
          tokenAddress,
          BLOCKCHAIN_DAO_TOKEN_ABI,
        );

        const code = await readOnlyTdfToken.provider.getCode(
          tokenAddress,
        );
        if (code === '0x') {
          console.warn('Token contract not found at specified address');
          const result = 0;
          getCurrentSupplyWithoutWalletResultCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }

        try {
          const supplyInWei = await readOnlyTdfToken.totalSupply();
          const supply = parseInt(utils.formatEther(supplyInWei));
          getCurrentSupplyWithoutWalletResultCache.set(cacheKey, { result: supply, timestamp: Date.now() });
          return supply;
        } catch (contractError: any) {
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

  const getUserTdfBalance = async () => {
    const contracts = getContractInstances();
    if (!contracts?.TdfToken) {
      console.debug('Contracts not ready');
      return 0;
    }

    try {
      const balanceInWei = await contracts.TdfToken.balanceOf(account);
      const balance = parseInt(utils.formatEther(balanceInWei));
      return balance;
    } catch (error) {
      console.log(error);
      return 0;
    }
  };

  const getTokensAvailableForPurchase = async () => {
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
        if (!library) {
          const result = 0;
          getTokensAvailableForPurchaseResultCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }

        const contracts = getContractInstances();
        if (!contracts?.TdfToken || !contracts?.DynamicSale) {
          const result = 0;
          getTokensAvailableForPurchaseResultCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }

        const supply = await contracts.TdfToken.totalSupply();
        const saleCap = await contracts.DynamicSale.saleHardCap();

        const remainingTokens = saleCap.sub(supply);
        const result = parseInt(utils.formatEther(remainingTokens));
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
    const contracts = getContractInstances();
    if (!contracts?.DynamicSale) {
      return { error: new Error('Contracts not ready'), success: false, txHash: null };
    }
    const { DynamicSale } = contracts;
    const amountInWei = utils.parseEther(amount);

    try {
      const txData = DynamicSale.interface.encodeFunctionData('buy', [amountInWei]);
      const tx = await DynamicSale.signer.sendTransaction({
        to: DynamicSale.address,
        data: txData + dataSuffix,
      })
      setPending(true);
      const receipt = await tx.wait();
      const success = receipt.status === 1;

      const chainId = await DynamicSale.signer.getChainId();
      // do not send Divvi referral on alfajores testnet
      if (chainId !== 44787) {
        try {
          await submitReferral({
            txHash: tx.hash as `0x${string}`,
            chainId,
          })
        } catch (error) {
          console.error('submitReferral error:', error);
        }
      }

      console.log(receipt);
      console.log({
        error: success ? null : new Error('reverted'),
        success,
        txHash: receipt.transactionHash,
      });
      return {
        error: success ? null : new Error('reverted'),
        success,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      //User rejected transaction
      console.error('stakeTokens', error);
      return {
        error,
        success: false,
        txHash: null,
      };
    } finally {
      setPending(false);
    }
  };

  const getTotalCost = async (amount: string) => {
    const contracts = getContractInstances();
    if (!contracts?.DynamicSale) {
      return 0;
    }
    const amountInWei = utils.parseEther(amount);
    const { totalCost } = await contracts.DynamicSale.calculateTotalCost(amountInWei);
    return parseFloat(utils.formatEther(totalCost));
  };

  const getTotalCostWithoutWallet = async (amount: string) => {
    try {
      setPending(true);
      if (!BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS || !BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI) {
        console.debug('Config not yet initialized for dynamic sale contract');
        return 0;
      }

      const readOnlyDynamicSale = await getReadOnlyContractInstance(
        BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
        BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI
      );

      const amountInWei = utils.parseEther(amount);
      const { totalCost } = await readOnlyDynamicSale.calculateTotalCost(amountInWei);
      return parseFloat(utils.formatEther(totalCost));
    } catch (error: any) {
      const message = error?.reason || error?.message || String(error);
      if (message.includes('totalSupply too low')) {
        console.error('DynamicSale not yet active:', message);
      } else {
        console.error('Error in getTotalCostWithoutWallet:', error);
      }
      return 0;
    } finally {
      setPending(false);
    }
  };

  const isCeurApproved = async (tdfAmount: string) => {
    const contracts = getContractInstances();
    if (!contracts?.DynamicSale || !contracts?.Ceur) {
      return false;
    }
    const amountInWei = utils.parseEther(tdfAmount);
    const { totalCost } = await contracts.DynamicSale.calculateTotalCost(amountInWei);
    const allowance = await contracts.Ceur.allowance(account, contracts.DynamicSale.address);
    return allowance.gte(totalCost);
  };

  const approveCeur = async (amount: number) => {
    const contracts = getContractInstances();
    if (!contracts?.Ceur || !contracts?.DynamicSale) {
      return { error: new Error('Contracts not ready'), success: false };
    }
    const { Ceur, DynamicSale } = contracts;
    // we add a small buffer to the approval amount to make up for price increases
    // that might occur after approval
    const bufferFactor = 1.05;
    const approvalAmount = utils.parseEther((bufferFactor * amount).toString());

    try {
      const txData = Ceur.interface.encodeFunctionData('approve', [DynamicSale.address, approvalAmount]);
      const tx = await Ceur.signer.sendTransaction({
        to: Ceur.address,
        data: txData + dataSuffix,
      })
      setPending(true);
      const receipt = await tx.wait();
      const chainId = await Ceur.signer.getChainId();
      // do not send Divvi referral on alfajores testnet
      if (chainId !== 44787) {
        try {
        await submitReferral({
          txHash: tx.hash as `0x${string}`,
            chainId,
          })
        } catch (error) {
          console.error('submitReferral error:', error);
        }
      }
      const success = receipt.status === 1;
      return {
        error: success ? null : new Error('reverted'),
        success,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      //User rejected transaction
      console.error('stakeTokens', error);
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
