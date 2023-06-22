import { useContext } from 'react';

import { Contract, utils } from 'ethers';

import { BONDING_CURVE_COEFFICIENTS } from '../constants';
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

  const getTokenPrice = async () => {
    const { TdfToken } = getContractInstances();
    const { a, b, c } = BONDING_CURVE_COEFFICIENTS;

    try {
      const supplyInWei = await TdfToken.totalSupply();
      const supply = parseInt(utils.formatEther(supplyInWei));
      const currentPrice = c - a / supply ** 2 + b / supply ** 3;
      return parseFloat(currentPrice.toFixed(2));
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
  return { getTokenPrice, buyTokens, getTokensAvailableForPurchase };
};
