import { useContext, useState } from 'react';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { Contract, utils } from 'ethers';

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
  const walletState = useContext(WalletState);
  const walletDispatch = useContext(WalletDispatch);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [isPending, setPending] = useState(false);

  const { isWalletReady, account, library } = walletState || {};
  const { updateWalletBalance, refetchBookingDates } = walletDispatch || {};

  if (!updateWalletBalance || !refetchBookingDates) {
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

      const pricePerNightBigNum = utils.parseUnits(
        dailyValue.toString(),
        BLOCKCHAIN_DAO_TOKEN.decimals,
      );

      const txData = Diamond.interface.encodeFunctionData('bookAccommodation', [
        bookingNights,
        pricePerNightBigNum,
      ]);
      const txRequest = {
        to: Diamond.address,
        data: txData,
        bookingNights,
        dailyValue,
        pricePerNightBigNum: pricePerNightBigNum.toString(),
      };
      console.log('Token booking transaction request', txRequest);
      const tx3 = await Diamond.signer.sendTransaction({
        to: Diamond.address,
        data: txData,
      });
      const txResponse = {
        hash: tx3.hash,
        from: tx3.from,
        nonce: tx3.nonce,
        gasLimit: tx3.gasLimit?.toString(),
        data: tx3.data,
        value: tx3.value?.toString(),
        chainId: tx3.chainId,
      };
      console.log('Token booking transaction sent', txResponse);
      setPendingTransactions([...pendingTransactions, tx3.hash]);
      const receipt = await tx3.wait();
      console.log('Token booking transaction mined', {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status,
        gasUsed: receipt.gasUsed?.toString(),
      });

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
      console.log('Token booking transaction error', {
        reason: error?.reason,
        message: error?.message,
        code: error?.code,
        transaction: error?.transaction,
        receipt: error?.receipt,
        error: error?.error,
        fullError: error,
      });
      const errorReason = error?.reason || error?.message || '';
      if (errorReason.includes('Booking already exists')) {
        return { error: null, success: { transactionId: 'existing' } };
      }
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