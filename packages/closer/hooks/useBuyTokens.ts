import { useContext, useState } from 'react';

import { Contract, utils } from 'ethers';

import { WalletState } from '../contexts/wallet';
import { useConfig } from './useConfig';

export const useBuyTokens = () => {
  const { library, account } = useContext(WalletState);
  const {
    BLOCKCHAIN_CROWDSALE_CONTRACT_ADDRESS,
    BLOCKCHAIN_CROWDSALE_CONTRACT_ABI,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DAO_TOKEN_ABI,
    CEUR_TOKEN_ADDRESS,
  } = useConfig() || {};
  const [isPending, setPending] = useState(false);

  const getContractInstances = () => ({
    Crowdsale: new Contract(
      BLOCKCHAIN_CROWDSALE_CONTRACT_ADDRESS,
      BLOCKCHAIN_CROWDSALE_CONTRACT_ABI,
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

  const getTokensAvailableForPurchase = async () => {
    return Promise.resolve({
      status: 'success',
      tokensAvailable: 1500,
      error: null,
    });
  };

  const buyTokens = async (amount: string) => {
    const { Crowdsale } = getContractInstances();
    const amountInWei = utils.parseEther(amount);

    try {
      const tx = await Crowdsale.buy(amountInWei);
      setPending(true);
      const receipt = await tx.wait();
      const success = receipt.status === 1;
      return {
        error: success ? null : new Error('reverted'),
        success,
        txHash: receipt.hash,
      };
    } catch (error) {
      //User rejected transaction
      console.error('stakeTokens', error);
      return {
        error,
        success: false,
        hash: null,
      };
    } finally {
      setPending(false);
    }
  };

  const getTotalCost = async (amount: string) => {
    const amountInWei = utils.parseEther(amount);
    const { Crowdsale } = getContractInstances();
    const { totalCost } = await Crowdsale.calculateTotalCost(amountInWei);
    return parseFloat(utils.formatEther(totalCost));
  };

  const isCeurApproved = async (tdfAmount: string) => {
    const amountInWei = utils.parseEther(tdfAmount);
    const { Crowdsale, Ceur } = getContractInstances();
    const { totalCost } = await Crowdsale.calculateTotalCost(amountInWei);
    const allowance = await Ceur.allowance(account, Crowdsale.address);
    return allowance.gte(totalCost);
  };

  const approveCeur = async (amount: number) => {
    const { Ceur, Crowdsale } = getContractInstances();
    // we add a small buffer to the approval amount to make up for price increases
    // that might occur after approval
    const bufferFactor = 1.05;
    const approvalAmount = utils.parseEther((bufferFactor * amount).toString());

    try {
      const tx = await Ceur.approve(Crowdsale.address, approvalAmount);
      setPending(true);
      const receipt = await tx.wait();
      const success = receipt.status === 1;
      return {
        error: success ? null : new Error('reverted'),
        success,
        txHash: receipt.hash,
      };
    } catch (error) {
      //User rejected transaction
      console.error('stakeTokens', error);
      return {
        error,
        success: false,
        hash: null,
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
    isCeurApproved,
    approveCeur,
    isPending,
  };
};
