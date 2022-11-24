import { useMemo, useState } from 'react';

import { useWeb3React } from '@web3-react/core';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { BigNumber, Contract } from 'ethers';
import useSWR from 'swr';

import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DIAMOND_ABI,
} from '../config_blockchain';
import { fetcher } from '../utils/blockchain';

dayjs.extend(dayOfYear);

export const useTokenPayment = ({ startDate, totalNights, dailyValue }) => {
  const { account, library } = useWeb3React();
  const [pendingTransactions, setPendingTransactions] = useState([]); //In general the following pendingTransactions state should be moved to the root of the app, and should be used as a dependency by all hooks that read blockchain state
  const [isPending, setPending] = useState(false);
  const bookingYear = dayjs(startDate).year();
  const totalNightsContractForm = Array.from(
    { length: totalNights },
    (_, i) => [bookingYear, dayjs(startDate).add(i, 'day').dayOfYear()],
  );
  const { data: bookedNights, mutate: updateBookedNights } = useSWR(
    [
      BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
      'getAccommodationBookings',
      account,
      bookingYear,
    ],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  const isStakingConfirmedOnBlockchain = useMemo(() => {
    if (!bookedNights) return false;
    const areAllNightsBooked = totalNightsContractForm.every((night) => {
      const [year, dayOfYear] = night;
      return bookedNights.some(
        (bookedNight) =>
          bookedNight.year === year && bookedNight.dayOfYear === dayOfYear,
      );
    });

    return areAllNightsBooked;
  }, [bookedNights, totalNightsContractForm]);

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
        totalNightsContractForm,
        pricePerNightBigNum,
      );

      setPendingTransactions([...pendingTransactions, tx3.hash]);
      await tx3.wait();
      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter((h) => h !== tx3.hash),
      );
      updateBookedNights();
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

  return { stakeTokens, isPending, isStakingConfirmedOnBlockchain };
};
