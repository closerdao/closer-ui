import { useContext, useState } from 'react';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { BigNumber, Contract, utils } from 'ethers';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { checkIfBookingEqBlockchain } from '../utils/helpers';
import { useConfig } from './useConfig';

dayjs.extend(dayOfYear);

const ERC20_TRANSFER_IFACE = new utils.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

const toParseUnitsDecimalString = (dailyValue) => {
  if (typeof dailyValue !== 'number' || !Number.isFinite(dailyValue)) {
    return String(dailyValue);
  }
  const rounded = Math.round(dailyValue * 1e6) / 1e6;
  const s = rounded.toFixed(6).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
};

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

  const Diamond = new Contract(
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DIAMOND_ABI,
    library && library.getUncheckedSigner(),
  );

  const checkContract = async (bookingNightsOverride) => {
    if (!library || !account || !isWalletReady) {
      return;
    }

    const nights =
      Array.isArray(bookingNightsOverride) && bookingNightsOverride.length > 0
        ? bookingNightsOverride
        : bookingNights;
    const [[yearForContract]] = nights;

    const contractNightsUpdated = await Diamond.getAccommodationBookings(
      account,
      yearForContract,
    );
    const isBookingMatchContract = checkIfBookingEqBlockchain(
      nights,
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

  const stakeTokens = async (dailyValue, bookingNightsOverride) => {
    if (!library || !account || !dailyValue || !isWalletReady) {
      return;
    }

    const nights =
      Array.isArray(bookingNightsOverride) && bookingNightsOverride.length > 0
        ? bookingNightsOverride
        : bookingNights;

    try {
      setPending(true);

      const pricePerNightBigNum = utils.parseUnits(
        toParseUnitsDecimalString(dailyValue),
        BLOCKCHAIN_DAO_TOKEN.decimals,
      );

      const txData = Diamond.interface.encodeFunctionData('bookAccommodation', [
        nights,
        pricePerNightBigNum,
      ]);
      const txRequest = {
        to: Diamond.address,
        data: txData,
        bookingNights: nights,
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
      const decimals = BLOCKCHAIN_DAO_TOKEN?.decimals ?? 18;
      const tokenAddrLower = (BLOCKCHAIN_DAO_TOKEN?.address || '').toLowerCase();
      let tdfSentFromWalletWei = BigNumber.from(0);
      let tdfTransferLogCount = 0;
      if (tokenAddrLower && receipt?.logs?.length) {
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== tokenAddrLower) continue;
          try {
            const ev = ERC20_TRANSFER_IFACE.parseLog(log);
            if (ev?.name === 'Transfer') {
              tdfTransferLogCount += 1;
              if (ev.args.from?.toLowerCase() === account.toLowerCase()) {
                tdfSentFromWalletWei = tdfSentFromWalletWei.add(ev.args.value);
              }
            }
          } catch (_) {}
        }
      }
      const expectedTotalWei = pricePerNightBigNum.mul(nights.length);
      const lockedStakeAtPerNight = [];
      if (receipt?.status === 1 && Diamond?.lockedStakeAt) {
        for (const pair of nights) {
          const y = Number(pair[0]);
          const d = Number(pair[1]);
          try {
            const wei = await Diamond.lockedStakeAt(account, y, d);
            lockedStakeAtPerNight.push({
              year: y,
              dayOfYear: d,
              wei: wei.toString(),
              tokens: utils.formatUnits(wei, decimals),
            });
          } catch (e) {
            lockedStakeAtPerNight.push({
              year: y,
              dayOfYear: d,
              lockedStakeAtError: e?.message || String(e),
            });
          }
        }
      }
      console.log('Token booking transaction mined', {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status,
        gasUsed: receipt.gasUsed?.toString(),
        nightCount: nights.length,
        pricePerNightWei: pricePerNightBigNum.toString(),
        expectedTotalWei: expectedTotalWei.toString(),
        expectedTotalTokens: utils.formatUnits(expectedTotalWei, decimals),
        tdfTransferLogCount,
        tdfSentFromWalletWei: tdfSentFromWalletWei.toString(),
        tdfSentFromWallet: utils.formatUnits(tdfSentFromWalletWei, decimals),
        lockedStakeAtPerNight,
        note:
          receipt?.status === 1 && tdfTransferLogCount === 0
            ? 'No TDF Transfer logs: facet likely reused existing year stake / delta was zero; explorers show token transfers only when ERC-20 Transfer fires.'
            : undefined,
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
      return {
        error: null,
        success: {
          transactionId: tx3.hash,
          tdfTransferLogCount,
          tdfSentFromWalletWei: tdfSentFromWalletWei.toString(),
          expectedTotalStakeWei: expectedTotalWei.toString(),
        },
      };
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