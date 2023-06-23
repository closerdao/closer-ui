import { useContext } from 'react';

import { Contract, utils } from 'ethers';

import { WalletState } from '../contexts/wallet';
import { useConfig } from './useConfig';

export const useBuyTokens = () => {
  const { library } = useContext(WalletState);
  const {
    BLOCKCHAIN_CROWDSALE_CONTRACT_ADDRESS,
    BLOCKCHAIN_CROWDSALE_CONTRACT_ABI,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DAO_TOKEN_ABI,
  } = useConfig();

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

  const buyTokens = async (tokens: number) => {
    return Promise.resolve({
      status: 'success',
      transactionId: '12345',
      amountOfTokensPurchased: 15,
      error: null,
    });
  };

  const getTotalCost = async (amount: string) => {
    const amountInWei = utils.parseEther(amount);
    const { Crowdsale } = getContractInstances();

    const { totalCost } = await Crowdsale.calculateTotalCost(amountInWei);

    return parseFloat(utils.formatEther(totalCost));
  };

  return {
    getCurrentSupply,
    buyTokens,
    getTokensAvailableForPurchase,
    getTotalCost,
  };
};
