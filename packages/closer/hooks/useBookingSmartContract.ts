import { useContext, useState } from 'react';
import { usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { checkIfBookingEqBlockchain } from '../utils/helpers';
import { useConfig } from './useConfig';

const dataSuffix = getDataSuffix({
  consumer: '0x9B5f6dF2C7A331697Cf2616CA884594F6afDC07d',
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca',
    '0xc95876688026be9d6fa7a7c33328bd013effa2bb',
    '0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8',
  ],
});

interface BookingSmartContractProps {
  bookingNights: number[][] | null;
}

interface StakeResult {
  error: Error | string | null;
  success: { transactionId: string } | null;
}

interface CheckContractResult {
  success: boolean;
  error: string | null;
}

export const useBookingSmartContract = ({ bookingNights }: BookingSmartContractProps) => {
  const {
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DIAMOND_ABI,
  } = useConfig();

  const { isWalletReady, account } = useContext(WalletState);
  const { updateWalletBalance, refetchBookingDates } = useContext(WalletDispatch);
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const [pendingTransactions, setPendingTransactions] = useState<string[]>([]);
  const [isPending, setPending] = useState(false);

  if (!updateWalletBalance || !refetchBookingDates) {
    console.warn('useBookingSmartContract: Required wallet functions not available');
    return {
      stakeTokens: async (): Promise<StakeResult> => ({
        error: 'Wallet functions not available',
        success: null,
      }),
      isStaking: false,
      checkContract: async (): Promise<CheckContractResult> => ({
        success: false,
        error: 'Wallet functions not available',
      }),
    };
  }

  if (!bookingNights || !Array.isArray(bookingNights) || bookingNights.length === 0) {
    return {
      stakeTokens: async (): Promise<StakeResult> => ({
        error: 'No booking nights available',
        success: null,
      }),
      isStaking: false,
      checkContract: async (): Promise<CheckContractResult> => ({
        success: false,
        error: 'No booking nights available',
      }),
    };
  }

  const [[bookingYear]] = bookingNights;

  const checkContract = async (): Promise<CheckContractResult | undefined> => {
    if (!publicClient || !account || !isWalletReady) {
      return;
    }

    const contractNightsRaw = await publicClient.readContract({
      address: BLOCKCHAIN_DAO_DIAMOND_ADDRESS as `0x${string}`,
      abi: BLOCKCHAIN_DIAMOND_ABI,
      functionName: 'getAccommodationBookings',
      args: [account as `0x${string}`, BigInt(bookingYear)],
    });

    let contractNightsUpdated: number[][];
    if (Array.isArray(contractNightsRaw)) {
      contractNightsUpdated = contractNightsRaw.map((item: any) => {
        if (Array.isArray(item)) {
          return item.map((v: any) => (typeof v === 'bigint' ? Number(v) : v));
        }
        if (typeof item === 'object' && item !== null) {
          return Object.values(item).map((v: any) => (typeof v === 'bigint' ? Number(v) : v));
        }
        return [];
      });
    } else {
      contractNightsUpdated = [];
    }

    const isBookingMatchContract = checkIfBookingEqBlockchain(
      bookingNights,
      contractNightsUpdated,
    );

    if (isBookingMatchContract) {
      return { success: true, error: null };
    } else {
      return {
        success: false,
        error: 'Booking nights are not in the contract',
      };
    }
  };

  const stakeTokens = async (dailyValue: number): Promise<StakeResult | undefined> => {
    if (!publicClient || !walletClient || !account || !dailyValue || !isWalletReady) {
      console.error('stakeTokens: Missing required params', {
        hasPublicClient: !!publicClient,
        hasWalletClient: !!walletClient,
        account,
        dailyValue,
        isWalletReady,
      });
      return {
        error: 'Missing required wallet connection',
        success: null,
      };
    }

    try {
      setPending(true);

      console.log('stakeTokens params:', {
        dailyValue,
        bookingNights,
        account,
        contractAddress: BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
      });

      const pricePerNightBigNum = parseUnits(
        dailyValue.toString(),
        BLOCKCHAIN_DAO_TOKEN.decimals,
      );

      console.log('pricePerNightBigNum =', pricePerNightBigNum.toString());

      const formattedBookingNights = bookingNights.map((night) =>
        night.map((v) => BigInt(v))
      );

      const { request } = await publicClient.simulateContract({
        address: BLOCKCHAIN_DAO_DIAMOND_ADDRESS as `0x${string}`,
        abi: BLOCKCHAIN_DIAMOND_ABI,
        functionName: 'bookAccommodation',
        args: [formattedBookingNights, pricePerNightBigNum],
        account: account as `0x${string}`,
        dataSuffix: dataSuffix as `0x${string}`,
      });

      console.log('Contract simulation successful, sending transaction...');

      const hash = await walletClient.writeContract(request);

      console.log('Transaction sent:', hash);

      setPendingTransactions([...pendingTransactions, hash]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('Transaction confirmed:', receipt.status);

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      if (chainId !== 44787) {
        try {
          await submitReferral({
            txHash: hash,
            chainId,
          });
        } catch (error) {
          console.error('submitReferral error:', error);
        }
      }

      setPendingTransactions((prev) =>
        prev.filter((transactionId) => transactionId !== hash),
      );

      if (refetchBookingDates) {
        refetchBookingDates();
      }
      if (updateWalletBalance) {
        updateWalletBalance();
      }

      return { error: null, success: { transactionId: hash } };
    } catch (error: any) {
      console.error('stakeTokens error:', error);
      console.error('Error details:', {
        message: error?.message,
        cause: error?.cause,
        shortMessage: error?.shortMessage,
      });
      return {
        error: error?.shortMessage || error?.message || error,
        success: null,
      };
    } finally {
      setPending(false);
    }
  };

  return { stakeTokens, isStaking: isPending, checkContract };
};
