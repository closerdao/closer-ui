import { useEffect, useState, useContext } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { WalletState } from 'closer/contexts/wallet';
import { getContract, getCurrentNetwork } from '../utils/abiLoader';

export const usePresenceToken = () => {
  const { isWalletReady, account } = useContext(WalletState);
  const publicClient = usePublicClient();
  const [presenceBalance, setPresenceBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [contractAbi, setContractAbi] = useState<any[] | null>(null);

  useEffect(() => {
    const loadContractData = async () => {
      try {
        const network = getCurrentNetwork();
        const { address, abi } = await getContract('PresenceToken', network);

        if (address && abi) {
          setContractAddress(address);
          setContractAbi(abi);
        } else {
          console.error('Failed to load PresenceToken contract data');
          setError('Failed to load PresenceToken contract data');
        }
      } catch (err) {
        console.error('Error loading PresenceToken contract:', err);
        setError('Error loading PresenceToken contract');
      }
    };

    loadContractData();
  }, []);

  useEffect(() => {
    const fetchPresenceBalance = async () => {
      if (!isWalletReady || !account || !publicClient || !contractAddress || !contractAbi) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const balance = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: contractAbi,
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
  }, [isWalletReady, account, publicClient, contractAddress, contractAbi]);

  return {
    presenceBalance,
    isLoading,
    error,
  };
};
