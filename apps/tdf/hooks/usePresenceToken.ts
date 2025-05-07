import { useEffect, useState, useContext } from 'react';
import { Contract } from 'ethers';
import { WalletState } from 'closer/contexts/wallet';
import { getContract, getCurrentNetwork } from '../utils/abiLoader';

export const usePresenceToken = () => {
  const { isWalletReady, account, library } = useContext(WalletState);
  const [presenceBalance, setPresenceBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [contractAbi, setContractAbi] = useState<any[] | null>(null);

  // Load contract data
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

  // Fetch balance when contract data is loaded and wallet is ready
  useEffect(() => {
    const fetchPresenceBalance = async () => {
      if (!isWalletReady || !account || !library || !contractAddress || !contractAbi) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const presenceTokenContract = new Contract(
          contractAddress,
          contractAbi,
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
  }, [isWalletReady, account, library, contractAddress, contractAbi]);

  return {
    presenceBalance,
    isLoading,
    error,
  };
};
