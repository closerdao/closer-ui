import { useContext, useState } from 'react';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { BigNumber, Contract } from 'ethers';

import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DIAMOND_ABI,
} from '../config_blockchain';
import { WalletDispatch } from '../contexts/wallet';
import { WalletState } from '../contexts/wallet';
import { checkIfBookingEqBlockchain } from '../utils/helpers';

dayjs.extend(dayOfYear);

export const useBookingSmartContract = ({ bookingNights }) => {
  const { isWalletReady, account, library } = useContext(WalletState);
  const { updateWalletBalance, refetchBookingDates } =
    useContext(WalletDispatch);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isPending, setPending] = useState(false);
  const [[bookingYear]] = bookingNights;

  const Diamond = new Contract(
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DIAMOND_ABI,
    library && library.getUncheckedSigner(),
  );

  const checkContract = async () => {
    if (!library || !account || !isWalletReady) {
      return;
    }

    const contractNightsUpdated = await Diamond.getAccommodationBookings(
      account,
      bookingYear,
    );
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

  const stakeTokens = async (dailyValue) => {
    if (!library || !account || !dailyValue || !isWalletReady) {
      return;
    }

    try {
      setPending(true);
      const pricePerNightBigNum = BigNumber.from(dailyValue).mul(
        BigNumber.from(10).pow(BigNumber.from(BLOCKCHAIN_DAO_TOKEN.decimals)),
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
      refetchBookingDates();
      updateWalletBalance();
      return { error: null, success: { transactionId: tx3.hash } };
    } catch (error) {
      //User rejected transaction
      console.error('stakeTokens', error);
      return {
        error,
        success: null,
      };
    } finally {
      setPending(false);
    }
  };

  return { stakeTokens, isStaking: isPending, checkContract };
};
