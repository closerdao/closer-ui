import { useContext, useState } from 'react';

import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { Contract, utils } from 'ethers';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { checkIfBookingEqBlockchain } from '../utils/helpers';
import { useConfig } from './useConfig';

dayjs.extend(dayOfYear);

const dataSuffix = getDataSuffix({
  consumer: '0x9B5f6dF2C7A331697Cf2616CA884594F6afDC07d',
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca',
    '0xc95876688026be9d6fa7a7c33328bd013effa2bb',
    '0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8',
  ],
});

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

  // Safety check for required functions
  if (!updateWalletBalance || !refetchBookingDates) {
    console.warn(
      'useBookingSmartContract: Required wallet functions not available',
    );
    return {
      stakeTokens: async () => ({
        error: 'Wallet functions not available',
        success: null,
      }),
      isStaking: false,
      checkContract: async () => ({
        success: false,
        error: 'Wallet functions not available',
      }),
    };
  }

  // Safety check for bookingNights
  if (
    !bookingNights ||
    !Array.isArray(bookingNights) ||
    bookingNights.length === 0
  ) {
    return {
      stakeTokens: async () => ({
        error: 'No booking nights available',
        success: null,
      }),
      isStaking: false,
      checkContract: async () => ({
        success: false,
        error: 'No booking nights available',
      }),
    };
  }

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

      const chainId = await Diamond.signer.getChainId();

      const txData = Diamond.interface.encodeFunctionData('bookAccommodation', [
        bookingNights,
        pricePerNightBigNum,
      ]);
      const tx3 = await Diamond.signer.sendTransaction({
        to: Diamond.address,
        data: txData + dataSuffix,
      });
      setPendingTransactions([...pendingTransactions, tx3.hash]);
      await tx3.wait();

      // do not send Divvi referral on alfajores testnet
      if (chainId !== 44787) {
        try {
          await submitReferral({
            txHash: tx3.hash,
            chainId,
          });
        } catch (error) {
          console.error('submitReferral error:', error);
        }
      }

      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter(
          (transactionId) => transactionId !== tx3.hash,
        ),
      );
      if (refetchBookingDates) {
        refetchBookingDates();
      }
      if (updateWalletBalance) {
        updateWalletBalance();
      }
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