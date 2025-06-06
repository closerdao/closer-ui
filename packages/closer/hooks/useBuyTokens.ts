import { useContext, useState } from 'react';
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'
import { Contract, utils } from 'ethers';
import { WalletState } from '../contexts/wallet';
import { useConfig } from './useConfig';

const dataSuffix = getDataSuffix({
  consumer: '0x9B5f6dF2C7A331697Cf2616CA884594F6afDC07d',
  providers: ['0x0423189886d7966f0dd7e7d256898daeee625dca','0xc95876688026be9d6fa7a7c33328bd013effa2bb','0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8'],
})

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
        await submitReferral({
          txHash: tx.hash as `0x${string}`,
          chainId,
        })
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
        await submitReferral({
          txHash: tx.hash as `0x${string}`,
          chainId,
        })
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
    buyTokens,
    getTokensAvailableForPurchase,
    getTotalCost,
    getUserTdfBalance,
    isCeurApproved,
    approveCeur,
    isPending,
  };
};
