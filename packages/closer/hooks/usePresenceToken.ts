import { useEffect, useState, useContext } from 'react';
import { Contract, utils } from 'ethers';

import { blockchainConfig } from 'closer/config_blockchain';
import { WalletState } from 'closer/contexts/wallet';

const { BLOCKCHAIN_PRESENCE_TOKEN, BLOCKCHAIN_PRESENCE_ABI } = blockchainConfig;

export const usePresenceToken = () => {
  const { isWalletReady, account, library } = useContext(WalletState);
  const [presenceBalance, setPresenceBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresenceBalance = async () => {
      if (!isWalletReady || !account || !library) {
        setPresenceBalance('0');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const presenceTokenContract = new Contract(
          BLOCKCHAIN_PRESENCE_TOKEN.address,
          BLOCKCHAIN_PRESENCE_ABI,
          library,
        );

        const [balanceRaw, decimalsRaw] = await Promise.all([
          presenceTokenContract.balanceOf(account),
          presenceTokenContract.decimals?.().catch(() => null),
        ]);
        const decimals =
          typeof decimalsRaw === 'number'
            ? decimalsRaw
            : BLOCKCHAIN_PRESENCE_TOKEN.decimals;
        const formattedBalance = utils.formatUnits(balanceRaw, decimals);
        setPresenceBalance(formattedBalance);
      } catch (err) {
        console.error('Error fetching Presence token balance:', err);
        setError('Failed to fetch Presence token balance');
        setPresenceBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresenceBalance();

    const intervalId = setInterval(fetchPresenceBalance, 30000);
    return () => clearInterval(intervalId);
  }, [isWalletReady, account, library]);

  return {
    presenceBalance,
    isLoading,
    error,
  };
};
