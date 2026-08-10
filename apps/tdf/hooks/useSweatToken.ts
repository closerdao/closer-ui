import { useEffect, useState, useContext } from 'react';
import { Contract } from 'ethers';
import { WalletState } from 'closer';
import { getContract, getCurrentNetwork } from '../utils/abiLoader';

export const useSweatToken = () => {
  const { isWalletReady, account, library } = useContext(WalletState);
  const [sweatBalance, setSweatBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [contractAbi, setContractAbi] = useState<any[] | null>(null);

  // Load contract data
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

  // Fetch balance when contract data is loaded and wallet is ready
  useEffect(() => {
    const fetchSweatBalance = async () => {
      if (!isWalletReady || !account || !library || !contractAddress || !contractAbi) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const sweatTokenContract = new Contract(
          contractAddress,
          contractAbi,
          library.getSigner()
        );

        const balance = await sweatTokenContract.balanceOf(account);
        setSweatBalance(balance.toString());
      } catch (err) {
        console.error('Error fetching Sweat token balance:', err);
        setError('Failed to fetch Sweat token balance');
        setSweatBalance('0');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSweatBalance();
  }, [isWalletReady, account, library, contractAddress, contractAbi]);

  return {
    sweatBalance,
    isLoading,
    error,
  };
};
