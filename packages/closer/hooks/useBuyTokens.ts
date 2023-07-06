import { useContext, useState } from 'react';

import { Contract, utils } from 'ethers';

import { WalletState } from '../contexts/wallet';
import { useConfig } from './useConfig';

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
    buyTokens,
    getTokensAvailableForPurchase,
    getTotalCost,
    getUserTdfBalance,
    isCeurApproved,
    approveCeur,
    isPending,
  };
};
