import { useEffect, useState, useContext } from 'react';
import { Contract, utils } from 'ethers';

import { blockchainConfig } from 'closer/config_blockchain';
import { WalletState } from 'closer/contexts/wallet';

const { BLOCKCHAIN_SWEAT_TOKEN, BLOCKCHAIN_SWEAT_TOKEN_ABI } =
  blockchainConfig;

export const useSweatToken = () => {
  const { isWalletReady, account, library } = useContext(WalletState);
  const [sweatBalance, setSweatBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSweatBalance = async () => {
      if (!isWalletReady || !account || !library) {
        setSweatBalance('0');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const sweatTokenContract = new Contract(
          BLOCKCHAIN_SWEAT_TOKEN.address,
          BLOCKCHAIN_SWEAT_TOKEN_ABI,
          library,
        );

        const [balanceRaw, decimalsRaw] = await Promise.all([
          sweatTokenContract.balanceOf(account),
          sweatTokenContract.decimals?.().catch(() => null),
        ]);
        const decimals =
          typeof decimalsRaw === 'number'
            ? decimalsRaw
            : BLOCKCHAIN_SWEAT_TOKEN.decimals;
        const formattedBalance = utils.formatUnits(balanceRaw, decimals);
        setSweatBalance(formattedBalance);
      } catch (err) {
        console.error('Error fetching Sweat token balance:', err);
        setError('Failed to fetch Sweat token balance');
        setSweatBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSweatBalance();

    const intervalId = setInterval(fetchSweatBalance, 30000);
    return () => clearInterval(intervalId);
  }, [isWalletReady, account, library]);

  return {
    sweatBalance,
    isLoading,
    error,
  };
};
