import { useEffect, useState, useContext } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { WalletState } from 'closer/contexts/wallet';
import { getContract, getCurrentNetwork } from '../utils/abiLoader';

export const useSweatToken = () => {
  const { isWalletReady, account } = useContext(WalletState);
  const publicClient = usePublicClient();
  const [sweatBalance, setSweatBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [contractAbi, setContractAbi] = useState<any[] | null>(null);

  useEffect(() => {
    const loadContractData = async () => {
      try {
        const network = getCurrentNetwork();
        const { address, abi } = await getContract('SweatToken', network);

        if (address && abi) {
          setContractAddress(address);
          setContractAbi(abi);
        } else {
          console.error('Failed to load SweatToken contract data');
          setError('Failed to load SweatToken contract data');
        }
      } catch (err) {
        console.error('Error loading SweatToken contract:', err);
        setError('Error loading SweatToken contract');
      }
    };

    loadContractData();
  }, []);

  useEffect(() => {
    const fetchSweatBalance = async () => {
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

        setSweatBalance(formatUnits(balance, 18));
      } catch (err) {
        console.error('Error fetching Sweat token balance:', err);
        setError('Failed to fetch Sweat token balance');
        setSweatBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSweatBalance();
  }, [isWalletReady, account, publicClient, contractAddress, contractAbi]);

  return {
    sweatBalance,
    isLoading,
    error,
  };
};
