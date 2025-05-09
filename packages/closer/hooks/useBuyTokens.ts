import { useContext, useEffect, useState } from 'react';

import { Contract, providers, utils } from 'ethers';

import { WalletState } from '../contexts/wallet';
import { useConfig } from './useConfig';

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

const getReadOnlyContractInstance = async (address: string, abi: any) => {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'alfajores';
  const endpoints = RPC_ENDPOINTS[network as keyof typeof RPC_ENDPOINTS];

  console.debug('Using network:', network);

  for (const rpcUrl of endpoints) {
    try {
      const provider = new providers.JsonRpcProvider(rpcUrl);
      // Test the connection
      await provider.getNetwork();
      return new Contract(address, abi, provider);
    } catch (error) {
      console.warn(`Failed to connect to ${rpcUrl}:`, error);
      continue;
    }
  }
  throw new Error(`Unable to connect to any ${network} RPC endpoint`);
};

export const useBuyTokens = () => {
  const { library, account } = useContext(WalletState);
  const {
    BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
    BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DAO_TOKEN_ABI,
    CEUR_TOKEN_ADDRESS,
  } = useConfig() || {};
  const [isPending, setPending] = useState(false);
  const [isConfigReady, setIsConfigReady] = useState(false);

  useEffect(() => {
    if (BLOCKCHAIN_DAO_TOKEN?.address && BLOCKCHAIN_DAO_TOKEN_ABI) {
      setIsConfigReady(true);
    }
  }, [BLOCKCHAIN_DAO_TOKEN?.address, BLOCKCHAIN_DAO_TOKEN_ABI]);

  const getContractInstances = () => ({
    DynamicSale: new Contract(
      BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
      BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
      library && library.getUncheckedSigner(),
    ),
    TdfToken: new Contract(
      BLOCKCHAIN_DAO_TOKEN.address,
      BLOCKCHAIN_DAO_TOKEN_ABI,
      library && library.getUncheckedSigner(),
    ),
    Ceur: new Contract(
      CEUR_TOKEN_ADDRESS,
      BLOCKCHAIN_DAO_TOKEN_ABI,
      library && library.getUncheckedSigner(),
    ),
  });

  const getCurrentSupply = async () => {
    const { TdfToken } = getContractInstances();

    try {
      const supplyInWei = await TdfToken.totalSupply();
      const supply = parseInt(utils.formatEther(supplyInWei));
      return supply;
    } catch (error) {
      console.log(error);
      return 0;
    }
  };

  const getCurrentSupplyWithoutWallet = async () => {
    try {
      setPending(true);

      if (!BLOCKCHAIN_DAO_TOKEN?.address || !BLOCKCHAIN_DAO_TOKEN_ABI) {
        console.debug('Config not yet initialized, retrying in 1s...');

        await new Promise((resolve) => setTimeout(resolve, 1000));


        if (!BLOCKCHAIN_DAO_TOKEN?.address || !BLOCKCHAIN_DAO_TOKEN_ABI) {
          console.error('Config initialization timeout');
          return 0;
        }
      }

      const readOnlyTdfToken = await getReadOnlyContractInstance(
        BLOCKCHAIN_DAO_TOKEN.address,
        BLOCKCHAIN_DAO_TOKEN_ABI,
      );

      // Debug contract details
      console.debug('Contract details:', {
        network: process.env.NEXT_PUBLIC_NETWORK,
        address: BLOCKCHAIN_DAO_TOKEN.address,
        provider: (readOnlyTdfToken.provider as providers.JsonRpcProvider)
          .connection.url,
      });

      const code = await readOnlyTdfToken.provider.getCode(
        BLOCKCHAIN_DAO_TOKEN.address,
      );
      if (code === '0x') {
        console.warn('Token contract not found at specified address');
        return 0;
      }

      try {
        const name = await readOnlyTdfToken.name().catch(() => null);
        const symbol = await readOnlyTdfToken.symbol().catch(() => null);
        console.debug('Token details:', { name, symbol });

        const supplyInWei = await readOnlyTdfToken.totalSupply();
        const supply = parseInt(utils.formatEther(supplyInWei));
        return supply;
      } catch (contractError: any) {
        console.error('Contract call failed:', contractError);
        if (contractError?.error?.body) {
          try {
            const errorBody = JSON.parse(contractError.error.body);
            console.debug('Detailed error:', errorBody);
          } catch (e) {
            console.debug('Raw error body:', contractError.error.body);
          }
        }
        return 0;
      }
    } catch (error) {
      console.error('Error in getCurrentSupplyWithoutWallet:', error);
      return 0;
    } finally {
      setPending(false);
    }
  };

  const getUserTdfBalance = async () => {
    const { TdfToken } = getContractInstances();

    try {
      const balanceInWei = await TdfToken.balanceOf(account);
      const balance = parseInt(utils.formatEther(balanceInWei));
      return balance;
    } catch (error) {
      console.log(error);
      return 0;
    }
  };

  const getTokensAvailableForPurchase = async () => {
    const { TdfToken, DynamicSale } = getContractInstances();

    try {
      const supply = await TdfToken.totalSupply();
      const saleCap = await DynamicSale.saleHardCap();

      const remainingTokens = saleCap.sub(supply);
      return parseInt(utils.formatEther(remainingTokens));
    } catch (error) {
      console.log(error);
      return 0;
    }
  };

  const buyTokens = async (amount: string) => {
    const { DynamicSale } = getContractInstances();
    const amountInWei = utils.parseEther(amount);

    try {
      const tx = await DynamicSale.buy(amountInWei);
      setPending(true);
      const receipt = await tx.wait();
      const success = receipt.status === 1;
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
    const amountInWei = utils.parseEther(amount);
    const { DynamicSale } = getContractInstances();
    const { totalCost } = await DynamicSale.calculateTotalCost(amountInWei);
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
    } catch (error) {
      console.error('Error in getTotalCostWithoutWallet:', error);
      return 0;
    } finally {
      setPending(false);
    }
  };

  const isCeurApproved = async (tdfAmount: string) => {
    const amountInWei = utils.parseEther(tdfAmount);
    const { DynamicSale, Ceur } = getContractInstances();
    const { totalCost } = await DynamicSale.calculateTotalCost(amountInWei);
    const allowance = await Ceur.allowance(account, DynamicSale.address);
    return allowance.gte(totalCost);
  };

  const approveCeur = async (amount: number) => {
    const { Ceur, DynamicSale } = getContractInstances();
    // we add a small buffer to the approval amount to make up for price increases
    // that might occur after approval
    const bufferFactor = 1.05;
    const approvalAmount = utils.parseEther((bufferFactor * amount).toString());

    try {
      const tx = await Ceur.approve(DynamicSale.address, approvalAmount);
      setPending(true);
      const receipt = await tx.wait();
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
