import { useContext, useState } from 'react';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { utils } from 'ethers';
import { BigNumber, Contract } from 'ethers';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { checkIfBookingEqBlockchain } from '../utils/helpers';
import { useConfig } from './useConfig';

dayjs.extend(dayOfYear);

export const useBookingSmartContract = ({ bookingNights }) => {
  const {
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DIAMOND_ABI,
  } = useConfig();
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

      console.log('dailyValue =', dailyValue);

      const pricePerNightBigNum = utils.parseUnits(
        dailyValue.toString(),
        BLOCKCHAIN_DAO_TOKEN.decimals,
      );

      console.log('pricePerNightBigNum =', pricePerNightBigNum);

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
