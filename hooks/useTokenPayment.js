import { useState } from 'react';

import { useWeb3React } from '@web3-react/core';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { BigNumber, Contract } from 'ethers';

import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DIAMOND_ABI,
} from '../config_blockchain';
import { useBookingSmartContract } from './useBookingSmartContract';

dayjs.extend(dayOfYear);

export const useTokenPayment = ({ startDate, totalNights, dailyValue }) => {
  const { account, library } = useWeb3React();
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isPending, setPending] = useState(false);
  const bookingYear = dayjs(startDate).year();
  const bookingNights = Array.from({ length: totalNights }, (_, i) => [
    bookingYear,
    dayjs(startDate).add(i, 'day').dayOfYear(),
  ]);
  const { updateBlockchainCache } = useBookingSmartContract(bookingNights);

  const stakeTokens = async () => {
    if (!library || !account) {
      return;
    }

    const Diamond = new Contract(
      BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
      BLOCKCHAIN_DIAMOND_ABI,
      library.getUncheckedSigner(),
    );

    try {
      setPending(true);
      const pricePerNightBigNum = BigNumber.from(dailyValue).mul(
        BigNumber.from(10).pow(BLOCKCHAIN_DAO_TOKEN.decimals),
      );
      const tx3 = await Diamond.bookAccommodation(
        bookingNights,
        pricePerNightBigNum,
      );

      setPendingTransactions([...pendingTransactions, tx3.hash]);
      await tx3.wait();
      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter(
          (transactionId) => transactionId !== tx3.hash,
        ),
      );
      updateBlockchainCache();
      return { error: null, success: { transactionId: tx3.hash } };
    } catch (error) {
      //User rejected transaction
      console.error('useTokenPayment step 2', error);
      return {
        error,
        success: null,
      };
    } finally {
      setPending(false);
    }
  };

  return { stakeTokens, isPending };
};
