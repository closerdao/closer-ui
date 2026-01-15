import { useEffect, useState, useContext } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { WalletState } from 'closer/contexts/wallet';

const SWEAT_TOKEN_ADDRESS = '0x0987654321098765432109876543210987654321' as `0x${string}`;
const SWEAT_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export const useSweatToken = () => {
  const { isWalletReady, account } = useContext(WalletState);
  const publicClient = usePublicClient();
  const [sweatBalance, setSweatBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSweatBalance = async () => {
      if (!isWalletReady || !account || !publicClient) {
        setSweatBalance('0');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const balance = await publicClient.readContract({
          address: SWEAT_TOKEN_ADDRESS,
          abi: SWEAT_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [account as `0x${string}`],
        });

        const decimals = await publicClient.readContract({
          address: SWEAT_TOKEN_ADDRESS,
          abi: SWEAT_TOKEN_ABI,
          functionName: 'decimals',
        });

        setSweatBalance(formatUnits(balance, decimals));
      } catch (err) {
        console.error('Error fetching Sweat token balance:', err);
        setError('Failed to fetch Sweat token balance');
        setSweatBalance('0.4');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSweatBalance();
  }, [isWalletReady, account, publicClient]);

  return {
    sweatBalance,
    isLoading,
    error,
  };
};
