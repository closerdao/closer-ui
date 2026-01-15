import { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import { useConnectModal } from '@rainbow-me/rainbowkit';

import { blockchainConfig } from '../../config_blockchain';
import api from '../../utils/api';
import { useAuth } from '../auth';
import { targetChainId } from './wagmiConfig';
import { WalletStateContext, WalletActionsContext } from '../../types/wallet';

export const WalletState = createContext<WalletStateContext>({} as WalletStateContext);
export const WalletDispatch = createContext<WalletActionsContext>({} as WalletActionsContext);

const {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_NETWORK_ID,
  BLOCKCHAIN_CEUR_TOKEN,
  BLOCKCHAIN_CELO_TOKEN,
  BLOCKCHAIN_PRESENCE_ABI,
  BLOCKCHAIN_PRESENCE_TOKEN,
} = blockchainConfig;

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { address: account, isConnected: isWalletConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { user } = useAuth();

  const [isWalletReady, setIsWalletReady] = useState(false);
  const [balanceDAOToken, setBalanceDAOToken] = useState<bigint>(BigInt(0));
  const [balanceCeurToken, setBalanceCeurToken] = useState<bigint>(BigInt(0));
  const [balanceCeloToken, setBalanceCeloToken] = useState<bigint>(BigInt(0));
  const [stakedBalanceOf, setStakedBalanceOf] = useState<bigint>(BigInt(0));
  const [unlockedStake, setUnlockedStake] = useState<bigint>(BigInt(0));
  const [balancePresence, setBalancePresence] = useState<bigint>(BigInt(0));
  const [bookedDates, setBookedDates] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const isCorrectNetwork = BLOCKCHAIN_NETWORK_ID === chainId;
  const hasSameConnectedAccount =
    user?.walletAddress?.toLowerCase() === account?.toLowerCase();

  useEffect(() => {
    setIsWalletReady(
      isWalletConnected && isCorrectNetwork && hasSameConnectedAccount,
    );
  }, [chainId, isWalletConnected, account, user?.walletAddress, isCorrectNetwork, hasSameConnectedAccount]);

  const fetchBalances = useCallback(async () => {
    if (!publicClient || !account || !isWalletConnected) return;

    try {
      const [daoBalance, ceurBalance, celoBalance, stakedBalance, unlocked, presence] = await Promise.all([
        publicClient.readContract({
          address: BLOCKCHAIN_DAO_TOKEN.address as `0x${string}`,
          abi: BLOCKCHAIN_DAO_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [account],
        }).catch(() => BigInt(0)),
        publicClient.readContract({
          address: BLOCKCHAIN_CEUR_TOKEN.address as `0x${string}`,
          abi: BLOCKCHAIN_DAO_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [account],
        }).catch(() => BigInt(0)),
        publicClient.readContract({
          address: BLOCKCHAIN_CELO_TOKEN.address as `0x${string}`,
          abi: BLOCKCHAIN_DAO_TOKEN_ABI,
          functionName: 'balanceOf',
          args: [account],
        }).catch(() => BigInt(0)),
        publicClient.readContract({
          address: BLOCKCHAIN_DAO_DIAMOND_ADDRESS as `0x${string}`,
          abi: BLOCKCHAIN_DIAMOND_ABI,
          functionName: 'stakedBalanceOf',
          args: [account],
        }).catch(() => BigInt(0)),
        publicClient.readContract({
          address: BLOCKCHAIN_DAO_DIAMOND_ADDRESS as `0x${string}`,
          abi: BLOCKCHAIN_DIAMOND_ABI,
          functionName: 'unlockedStake',
          args: [account],
        }).catch(() => BigInt(0)),
        publicClient.readContract({
          address: BLOCKCHAIN_PRESENCE_TOKEN.address as `0x${string}`,
          abi: BLOCKCHAIN_PRESENCE_ABI,
          functionName: 'balanceOf',
          args: [account],
        }).catch(() => BigInt(0)),
      ]);

      setBalanceDAOToken(daoBalance as bigint);
      setBalanceCeurToken(ceurBalance as bigint);
      setBalanceCeloToken(celoBalance as bigint);
      setStakedBalanceOf(stakedBalance as bigint);
      setUnlockedStake(unlocked as bigint);
      setBalancePresence(presence as bigint);
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  }, [publicClient, account, isWalletConnected]);

  const fetchBookedDates = useCallback(async () => {
    if (!publicClient || !account || !isWalletConnected) return;

    try {
      const activatedBookingYears = await publicClient.readContract({
        address: BLOCKCHAIN_DAO_DIAMOND_ADDRESS as `0x${string}`,
        abi: BLOCKCHAIN_DIAMOND_ABI,
        functionName: 'getAccommodationYears',
      }).catch(() => []);

      if (Array.isArray(activatedBookingYears) && activatedBookingYears.length > 0) {
        const bookingsPromises = activatedBookingYears.map(([year]: [bigint]) =>
          publicClient.readContract({
            address: BLOCKCHAIN_DAO_DIAMOND_ADDRESS as `0x${string}`,
            abi: BLOCKCHAIN_DIAMOND_ABI,
            functionName: 'getAccommodationBookings',
            args: [account, year],
          }).catch(() => [])
        );

        const allBookings = await Promise.all(bookingsPromises);
        setBookedDates(allBookings.flat());
      }
    } catch (err) {
      console.error('Error fetching booked dates:', err);
    }
  }, [publicClient, account, isWalletConnected]);

  useEffect(() => {
    if (isWalletConnected && account) {
      fetchBalances();
      fetchBookedDates();
    }
  }, [isWalletConnected, account, fetchBalances, fetchBookedDates]);

  const formatBigNumberForDisplay = (value: bigint, decimals: number): number => {
    if (!value) return 0;
    return parseFloat(formatUnits(value, decimals));
  };

  const balanceTotal = formatBigNumberForDisplay(
    balanceDAOToken + stakedBalanceOf,
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceAvailable = formatBigNumberForDisplay(
    balanceDAOToken + unlockedStake,
    BLOCKCHAIN_DAO_TOKEN.decimals,
  );
  const balanceCeurAvailable = formatBigNumberForDisplay(
    balanceCeurToken,
    BLOCKCHAIN_CEUR_TOKEN.decimals,
  );
  const balanceCeloAvailable = formatBigNumberForDisplay(
    balanceCeloToken,
    BLOCKCHAIN_CELO_TOKEN.decimals,
  );
  const proofOfPresence = formatBigNumberForDisplay(
    balancePresence,
    BLOCKCHAIN_PRESENCE_TOKEN.decimals,
  );

  const connectWallet = useCallback(async () => {
    console.log('[connectWallet] called');
    
    if (openConnectModal) {
      openConnectModal();
    }
    
    return account || null;
  }, [openConnectModal, account]);

  const linkWalletWithUser = async (accountId: string, currentUser: any) => {
    if (!currentUser || !currentUser._id) {
      console.error('[linkWalletWithUser] User object or user._id is not available.');
      return null;
    }
    if (!accountId) {
      console.error('[linkWalletWithUser] accountId not provided.');
      return null;
    }

    try {
      const { data: { nonce } } = await api.post('/auth/web3/pre-sign', { walletAddress: accountId });
      const message = `Signing in with code ${nonce}`;
      const signedMessage = await signMessage(message, accountId);
      
      if (!signedMessage) {
        console.error('[linkWalletWithUser] Failed to sign message.');
        return null;
      }

      const { data: { results: userUpdated } } = await api.post('/auth/web3/connect', {
        signedMessage,
        walletAddress: accountId,
        message,
        userId: currentUser._id,
      });

      return userUpdated;
    } catch (err) {
      console.error('[linkWalletWithUser] Error:', err);
      return null;
    }
  };

  useEffect(() => {
    if (user && !user.walletAddress && account && isWalletConnected) {
      linkWalletWithUser(account, user);
    }
  }, [user, account, isWalletConnected]);

  const switchNetwork = useCallback(async () => {
    try {
      if (switchChain) {
        switchChain({ chainId: targetChainId });
      }
    } catch (err) {
      console.error('Error switching network:', err);
      setError(err as Error);
    }
  }, [switchChain]);

  const signMessage = useCallback(async (msg: string, _accountId: string): Promise<string | null> => {
    if (!walletClient) {
      console.error('Wallet client not available');
      return null;
    }

    try {
      const signature = await walletClient.signMessage({
        message: msg,
      });
      return signature;
    } catch (err) {
      console.error('Error signing message:', err);
      return null;
    }
  }, [walletClient]);

  const updateWalletBalance = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  const updateCeurBalance = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  const updateCeloBalance = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  const refetchBookingDates = useCallback(() => {
    fetchBookedDates();
  }, [fetchBookedDates]);

  return (
    <WalletState.Provider
      value={{
        isWalletConnected,
        isWalletReady,
        isCorrectNetwork,
        hasSameConnectedAccount,
        account: account || null,
        balanceTotal,
        balanceAvailable,
        balanceCeurAvailable,
        balanceCeloAvailable,
        proofOfPresence,
        bookedDates,
        error,
        library: publicClient,
        chainId,
      }}
    >
      <WalletDispatch.Provider
        value={{
          connectWallet,
          switchNetwork,
          updateWalletBalance,
          updateCeurBalance,
          updateCeloBalance,
          refetchBookingDates,
          signMessage,
        }}
      >
        {children}
      </WalletDispatch.Provider>
    </WalletState.Provider>
  );
};
