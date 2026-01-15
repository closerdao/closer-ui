import { useEffect, useState, useContext } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { WalletState } from 'closer/contexts/wallet';
import PresenceTokenABI from '../abis/PresenceToken.json';

const PRESENCE_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890' as `0x${string}`;

export const usePresenceToken = () => {
  const { isWalletReady, account } = useContext(WalletState);
  const publicClient = usePublicClient();
  const [presenceBalance, setPresenceBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresenceBalance = async () => {
      if (!isWalletReady || !account || !publicClient) {
        setPresenceBalance('0');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const balance = await publicClient.readContract({
          address: PRESENCE_TOKEN_ADDRESS,
          abi: PresenceTokenABI,
          functionName: 'balanceOf',
          args: [account as `0x${string}`],
        }) as bigint;

        setPresenceBalance(formatUnits(balance, 18));
      } catch (err) {
        console.error('Error fetching Presence token balance:', err);
        setError('Failed to fetch Presence token balance');
        setPresenceBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresenceBalance();
  }, [isWalletReady, account, publicClient]);

  return {
    presenceBalance,
    isLoading,
    error,
  };
};
