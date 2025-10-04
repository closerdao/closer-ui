import { useEffect, useState, useContext } from 'react';
import { Contract } from 'ethers';
import { WalletState } from 'closer/contexts/wallet';
import PresenceTokenABI from '../abis/PresenceToken.json';

// This is a placeholder - in a real implementation, this would be fetched from a config file or environment variable
const PRESENCE_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890';

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
          PRESENCE_TOKEN_ADDRESS,
          PresenceTokenABI,
          library.getSigner()
        );

        const balance = await presenceTokenContract.balanceOf(account);
        setPresenceBalance(balance.toString());
      } catch (err) {
        console.error('Error fetching Presence token balance:', err);
        setError('Failed to fetch Presence token balance');
        setPresenceBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresenceBalance();
  }, [isWalletReady, account, library]);

  return {
    presenceBalance,
    isLoading,
    error,
  };
};
