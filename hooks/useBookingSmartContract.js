import { useState } from 'react';

import { useWeb3React } from '@web3-react/core';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { BigNumber, Contract } from 'ethers';
import useSWR from 'swr';

import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_NETWORK_ID,
} from '../config_blockchain';
import { fetcher } from '../utils/blockchain';
import { checkIfBookingEqBlockchain } from '../utils/helpers';
import { useWallet } from './useWallet';

dayjs.extend(dayOfYear);

export const useBookingSmartContract = ({ bookingNights }) => {
  const { account, library, chainId } = useWeb3React();
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isPending, setPending] = useState(false);
  const [[bookingYear]] = bookingNights;
  const fetchKey = [
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    'getAccommodationBookings',
    account,
    bookingYear,
  ];
  const options = {
    revalidateOnMount: true,
  };
  const { data: contractNights, mutate: revalidateNights } = useSWR(
    fetchKey,
    fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    options,
  );

  const { updateWalletBalance } = useWallet();

  const Diamond = new Contract(
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DIAMOND_ABI,
    library && library.getUncheckedSigner(),
  );

  const checkContract = async () => {
    if (!library || !account || chainId !== BLOCKCHAIN_NETWORK_ID) {
      return;
    }

    const contractNightsUpdated = await Diamond.getAccommodationBookings(
      account,
      bookingYear,
    );
    // console.log('contractNightsUpdated', contractNightsUpdated);
    const isBookingMatchContract = checkIfBookingEqBlockchain(
      bookingNights,
      contractNightsUpdated,
    );
    if (isBookingMatchContract) {
      return { success: true, error: null };
    } else {
      return { success: false, error: 'Booking nights are not in contract' };
    }
  };

  const stakeTokens = async (dailyValue) => {
    if (
      !library ||
      !account ||
      !dailyValue ||
      chainId !== BLOCKCHAIN_NETWORK_ID
    ) {
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
      revalidateNights();
      updateWalletBalance();
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

  return { stakeTokens, contractNights, isStaking: isPending, checkContract };
};
