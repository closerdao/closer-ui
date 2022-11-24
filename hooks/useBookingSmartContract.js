import { useEffect, useMemo } from 'react';

import { useWeb3React } from '@web3-react/core';
import useSWR from 'swr';

import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DIAMOND_ABI,
} from '../config_blockchain';
import { fetcher } from '../utils/blockchain';

export const useBookingSmartContract = (bookingNights, bookingYear) => {
  const { account, library } = useWeb3React();

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

  const isBookingConfirmedOnBlockchain = useMemo(() => {
    const areAllNightsBooked = bookingNights.every(([year, dayOfYear]) =>
      bookedNights.some(
        (bookedNight) =>
          bookedNight.year === year && bookedNight.dayOfYear === dayOfYear,
      ),
    );
    return areAllNightsBooked;
  }, [bookedNights, bookingNights]);

  useEffect(() => {
    const checkIfBookingConfirmedOnBlockchain = () => {
      const areAllNightsBooked = bookingNights.every(([year, dayOfYear]) =>
        bookedNights.some(
          (bookedNight) =>
            bookedNight.year === year && bookedNight.dayOfYear === dayOfYear,
        ),
      );
      if (areAllNightsBooked) {
        updateBookedNights();
      }
    };
    if (bookedNights) {
      checkIfBookingConfirmedOnBlockchain();
    }
  }, [bookedNights]);

  return {
    isBookingConfirmedOnBlockchain,
    updateBlockchainCache: updateBookedNights,
  };
};
