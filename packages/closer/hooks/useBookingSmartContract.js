import { useContext, useState } from 'react';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { BigNumber, Contract, utils } from 'ethers';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import {
  classifyAccommodationBookingCoverage,
  countMatchingAccommodationBookingPrefix,
} from '../utils/accommodationBookingCoverage.helpers';
import {
  findLargestAccommodationBookingBatch,
  getAccommodationBookingGasCeiling,
} from '../utils/accommodationBookingGas';
import {
  buildLaterYearStakeConflictError,
  detectLaterYearStakeConflict,
} from '../utils/laterYearStakeConflict.helpers';
import {
  SOLIDITY_PANIC_UNDERFLOW,
  getSolidityPanicCode,
} from '../utils/smartContractErrorParser';
import {
  BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX,
  BOOK_ACCOMMODATION_TX_REVERTED_PREFIX,
} from '../utils/stakeBookingError.helpers';
import { useConfig } from './useConfig';

dayjs.extend(dayOfYear);

/** @typedef {import('../types/stayTokenStake').StayTokenStakeOptions} StayTokenStakeOptions */
/** @typedef {import('../types/stayTokenStake').StayTokenStakeProgress} StayTokenStakeProgress */

const ERC20_TRANSFER_IFACE = new utils.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

/** @type {StayTokenStakeProgress} */
const EMPTY_STAKING_PROGRESS = {
  completedNights: 0,
  totalNights: 0,
  requiresMultipleTransactions: false,
  phase: 'idle',
};

const toParseUnitsDecimalString = (dailyValue) => {
  if (typeof dailyValue !== 'number' || !Number.isFinite(dailyValue)) {
    return String(dailyValue);
  }
  const rounded = Math.round(dailyValue * 1e6) / 1e6;
  const s = rounded.toFixed(6).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
};

const toNumber = (value) =>
  BigNumber.isBigNumber(value) ? value.toNumber() : Number(value);

const bookingField = (booking, name, index) =>
  booking?.[name] ?? booking?.[index];
const bookingYear = (booking) => toNumber(bookingField(booking, 'year', 1));
const bookingDay = (booking) => toNumber(bookingField(booking, 'dayOfYear', 2));

const uniqueYears = (nights) => [
  ...new Set(nights.map(([year]) => Number(year)).filter(Number.isFinite)),
];

const loadBookingsByYear = async (Diamond, account, nights) => {
  const out = new Map();
  for (const year of uniqueYears(nights)) {
    out.set(year, await Diamond.getAccommodationBookings(account, year));
  }
  return out;
};

const isBookingAlreadyExistsError = (err) => {
  const parts = [
    err?.reason,
    err?.message,
    err?.error?.message,
    err?.data?.message,
  ];
  return parts.some(
    (part) =>
      typeof part === 'string' &&
      part.toLowerCase().includes('booking already exists'),
  );
};

const validateAccommodationYears = async (Diamond, nights) => {
  const yearStructs = new Map();
  for (const year of uniqueYears(nights)) {
    const [exists, yearStruct] = await Diamond.getAccommodationYear(year);
    if (!exists || !yearStruct?.enabled) {
      throw new Error(`ACCOMMODATION_YEAR_NOT_ACTIVE:${year}`);
    }
    yearStructs.set(year, yearStruct);
  }
  return yearStructs;
};

const countMatchingPrefix = async (
  Diamond,
  account,
  nights,
  pricePerNightWei,
) => {
  if (!nights.length) return 0;
  const bookingsByYear = await loadBookingsByYear(Diamond, account, nights);
  return countMatchingAccommodationBookingPrefix(
    bookingsByYear,
    nights,
    pricePerNightWei,
  );
};

const resolveAccommodationBookingCoverage = async ({
  Diamond,
  account,
  nights,
  pricePerNightWei,
}) => {
  try {
    const bookingsByYear = await loadBookingsByYear(Diamond, account, nights);
    const coverage = classifyAccommodationBookingCoverage(
      bookingsByYear,
      nights,
      pricePerNightWei,
    );
    if (coverage === 'complete') {
      return { error: null, success: { transactionId: 'existing' } };
    }
    if (coverage === 'conflict') {
      return {
        error: new Error(BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX),
        success: null,
      };
    }
  } catch (coverageError) {
    console.log(
      'Could not classify existing accommodation bookings',
      coverageError,
    );
  }
  return null;
};

const diagnoseLaterYearStakeConflict = async ({
  error,
  Diamond,
  account,
  nights,
  yearStructs,
  pricePerNightWei,
}) => {
  if (
    getSolidityPanicCode(error) !== SOLIDITY_PANIC_UNDERFLOW ||
    !Diamond.depositsStakedFor
  ) {
    return null;
  }

  try {
    const deposits = await Diamond.depositsStakedFor(account);
    for (const year of uniqueYears(nights)) {
      const yearEndTm = yearStructs.get(year)?.end;
      if (!yearEndTm) continue;
      const conflict = detectLaterYearStakeConflict({
        deposits,
        yearEndTm,
        pricePerNightWei,
      });
      if (conflict) {
        console.log('Token booking blocked by later-year stake', {
          bookingYear: year,
          laterYearStakeWei: conflict.laterYearStakeWei.toString(),
          pricePerNightWei: pricePerNightWei.toString(),
        });
        return buildLaterYearStakeConflictError(conflict, year);
      }
    }
  } catch (stakeError) {
    console.log('depositsStakedFor diagnosis failed', stakeError);
  }
  return null;
};

const parseGasLimitOverride = () => {
  const raw =
    typeof process !== 'undefined' && process.env
      ? process.env.NEXT_PUBLIC_BOOK_ACCOMMODATION_GAS_LIMIT
      : '';
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return trimmed && /^\d+$/.test(trimmed) ? BigNumber.from(trimmed) : null;
};

const inspectBookingReceipt = async ({
  receipt,
  account,
  batch,
  pricePerNightWei,
  token,
}) => {
  const decimals = token?.decimals ?? 18;
  const tokenAddrLower = (token?.address || '').toLowerCase();
  let tdfSentFromWalletWei = BigNumber.from(0);
  let tdfTransferLogCount = 0;

  if (tokenAddrLower && receipt?.logs?.length) {
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== tokenAddrLower) continue;
      try {
        const event = ERC20_TRANSFER_IFACE.parseLog(log);
        if (event?.name !== 'Transfer') continue;
        tdfTransferLogCount += 1;
        if (event.args.from?.toLowerCase() === account.toLowerCase()) {
          tdfSentFromWalletWei = tdfSentFromWalletWei.add(event.args.value);
        }
      } catch (_) {}
    }
  }

  const expectedTotalWei = pricePerNightWei.mul(batch.length);
  return {
    decimals,
    expectedTotalWei,
    tdfSentFromWalletWei,
    tdfTransferLogCount,
  };
};

export const useBookingSmartContract = ({ bookingNights }) => {
  const {
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DIAMOND_ABI,
    BLOCKCHAIN_EXPECTED_BLOCK_GAS_LIMIT,
  } = useConfig();
  const walletState = useContext(WalletState);
  const walletDispatch = useContext(WalletDispatch);
  const [isPending, setPending] = useState(false);
  const [stakingProgress, setStakingProgress] = useState({
    ...EMPTY_STAKING_PROGRESS,
    totalNights: bookingNights?.length || 0,
  });

  const { isWalletReady, account, library } = walletState || {};
  const { updateWalletBalance, refetchBookingDates } = walletDispatch || {};

  const resetStakingProgress = () =>
    setStakingProgress({
      ...EMPTY_STAKING_PROGRESS,
      totalNights: bookingNights?.length || 0,
    });

  const unavailableResult = (message) => ({
    stakeTokens: async () => ({ error: message, success: null }),
    isStaking: false,
    stakingProgress,
    resetStakingProgress,
    checkContract: async () => ({ success: false, error: message }),
  });

  if (!updateWalletBalance || !refetchBookingDates) {
    return unavailableResult('Wallet functions not available');
  }

  if (!Array.isArray(bookingNights) || bookingNights.length === 0) {
    return unavailableResult('No booking nights available');
  }

  const Diamond = new Contract(
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    BLOCKCHAIN_DIAMOND_ABI,
    library && library.getUncheckedSigner(),
  );

  const loadEffectiveGasCeiling = async () => {
    let blockGasLimit = null;
    let source = 'latest-block';
    try {
      const latestBlock = await library.getBlock('latest');
      if (latestBlock?.gasLimit) blockGasLimit = latestBlock.gasLimit;
    } catch (error) {
      console.log('Could not load latest block gas limit', error);
    }

    if (!blockGasLimit) {
      if (!BLOCKCHAIN_EXPECTED_BLOCK_GAS_LIMIT) {
        throw new Error('Could not determine a safe accommodation gas limit.');
      }
      blockGasLimit = BigNumber.from(BLOCKCHAIN_EXPECTED_BLOCK_GAS_LIMIT);
      source = 'network-config-fallback';
      console.log('Using configured accommodation block gas limit fallback', {
        blockGasLimit: blockGasLimit.toString(),
      });
    }

    let gasCeiling = getAccommodationBookingGasCeiling(blockGasLimit);
    const configuredLimit = parseGasLimitOverride();
    if (configuredLimit?.gt(0) && configuredLimit.lt(gasCeiling)) {
      gasCeiling = configuredLimit;
      source = `${source}+deployment-cap`;
    }

    return { blockGasLimit, gasCeiling, source };
  };

  const checkContract = async (bookingNightsOverride) => {
    if (!library || !account || !isWalletReady) return;
    const nights =
      Array.isArray(bookingNightsOverride) && bookingNightsOverride.length > 0
        ? bookingNightsOverride
        : bookingNights;

    const bookingsByYear = await loadBookingsByYear(Diamond, account, nights);
    const matches = nights.every(([yearRaw, dayRaw]) => {
      const year = Number(yearRaw);
      const day = Number(dayRaw);
      return (bookingsByYear.get(year) || []).some(
        (booking) =>
          bookingYear(booking) === year && bookingDay(booking) === day,
      );
    });
    return matches
      ? { success: true, error: null }
      : { success: false, error: 'Booking nights are not in the contract' };
  };

  /**
   * @param {*} dailyValueOrWei
   * @param {*} bookingNightsOverride
   * @param {StayTokenStakeOptions} [options]
   */
  const stakeTokens = async (
    dailyValueOrWei,
    bookingNightsOverride,
    options = {},
  ) => {
    if (!library || !account || !isWalletReady) return;

    const nights =
      Array.isArray(bookingNightsOverride) && bookingNightsOverride.length > 0
        ? bookingNightsOverride
        : bookingNights;
    const totalNights = nights.length;
    const requestedStartIndex = Math.max(
      0,
      Math.min(totalNights, Number(options.completedNightCount) || 0),
    );
    const onProgress =
      typeof options.onProgress === 'function' ? options.onProgress : null;

    const weiStr =
      typeof dailyValueOrWei === 'string' ? dailyValueOrWei.trim() : '';
    let targetPricePerNightWei;
    if (weiStr && /^\d+$/.test(weiStr)) {
      targetPricePerNightWei = BigNumber.from(weiStr);
    } else if (
      typeof dailyValueOrWei === 'number' &&
      Number.isFinite(dailyValueOrWei) &&
      dailyValueOrWei > 0
    ) {
      targetPricePerNightWei = utils.parseUnits(
        toParseUnitsDecimalString(dailyValueOrWei),
        BLOCKCHAIN_DAO_TOKEN.decimals,
      );
    } else {
      return;
    }

    if (targetPricePerNightWei.isZero()) return;

    let completedNights = requestedStartIndex;
    let requiresMultipleTransactions = requestedStartIndex > 0;
    let latestTransactionId = null;
    let totalTransferLogCount = 0;
    let totalSentFromWalletWei = BigNumber.from(0);

    const publishProgress = async ({ transactionId = null } = {}) => {
      setStakingProgress((current) => ({
        ...current,
        completedNights,
        totalNights,
        requiresMultipleTransactions,
      }));
      if (!onProgress) return;
      try {
        await onProgress({
          completedNightCount: completedNights,
          transactionId,
        });
      } catch (error) {
        console.log('Could not persist token staking progress', error);
      }
    };

    const completeExistingCoverage = async () => {
      completedNights = totalNights;
      await publishProgress({ transactionId: null });
      return { error: null, success: { transactionId: 'existing' } };
    };

    const resolveStakeBookingCoverage = async (
      coverageNights,
      pricePerNightWei,
    ) => {
      const coverageResult = await resolveAccommodationBookingCoverage({
        Diamond,
        account,
        nights: coverageNights,
        pricePerNightWei,
      });
      if (coverageResult?.success?.transactionId === 'existing') {
        return completeExistingCoverage();
      }
      return coverageResult;
    };

    try {
      setPending(true);
      setStakingProgress({
        completedNights,
        totalNights,
        requiresMultipleTransactions,
        phase: 'preparing',
      });

      const yearStructs = await validateAccommodationYears(Diamond, nights);
      const pricePerNightWei = targetPricePerNightWei;

      if (completedNights > 0) {
        // The contract key is only wallet + date, without a stay ID. Only a
        // prefix explicitly recorded for this stay is eligible for recovery;
        // never claim arbitrary matching dates as this stay's progress.
        const recordedPrefix = nights.slice(0, completedNights);
        const verifiedPrefix = await countMatchingPrefix(
          Diamond,
          account,
          recordedPrefix,
          targetPricePerNightWei,
        );
        if (verifiedPrefix !== completedNights) {
          completedNights = verifiedPrefix;
          requiresMultipleTransactions = completedNights > 0;
          await publishProgress();
        }
      }

      if (completedNights >= totalNights) {
        return completeExistingCoverage();
      }

      while (completedNights < totalNights) {
        const remainingNights = nights.slice(completedNights);
        const { blockGasLimit, gasCeiling, source } =
          await loadEffectiveGasCeiling();

        let gasSelection;
        try {
          gasSelection = await findLargestAccommodationBookingBatch({
            items: remainingNights,
            gasCeiling,
            estimateGas: (candidate) =>
              Diamond.estimateGas.bookAccommodation(
                candidate,
                pricePerNightWei,
              ),
          });
        } catch (estimateError) {
          if (
            isBookingAlreadyExistsError(estimateError) ||
            getSolidityPanicCode(estimateError) === SOLIDITY_PANIC_UNDERFLOW
          ) {
            const coverageResult = await resolveStakeBookingCoverage(
              remainingNights,
              pricePerNightWei,
            );
            if (coverageResult) return coverageResult;
          }
          const diagnosed = await diagnoseLaterYearStakeConflict({
            error: estimateError,
            Diamond,
            account,
            nights: remainingNights,
            yearStructs,
            pricePerNightWei,
          });
          if (diagnosed) return { error: diagnosed, success: null };
          throw estimateError;
        }

        const batch = remainingNights.slice(0, gasSelection.batchSize);
        if (gasSelection.requiresMultipleTransactions) {
          requiresMultipleTransactions = true;
        }
        setStakingProgress({
          completedNights,
          totalNights,
          requiresMultipleTransactions,
          phase: 'preparing',
        });

        try {
          await Diamond.callStatic.bookAccommodation(batch, pricePerNightWei);
        } catch (staticError) {
          if (
            isBookingAlreadyExistsError(staticError) ||
            getSolidityPanicCode(staticError) === SOLIDITY_PANIC_UNDERFLOW
          ) {
            const coverageResult = await resolveStakeBookingCoverage(
              remainingNights,
              pricePerNightWei,
            );
            if (coverageResult) return coverageResult;
          }
          const diagnosed = await diagnoseLaterYearStakeConflict({
            error: staticError,
            Diamond,
            account,
            nights: batch,
            yearStructs,
            pricePerNightWei,
          });
          return { error: diagnosed || staticError, success: null };
        }

        const txData = Diamond.interface.encodeFunctionData(
          'bookAccommodation',
          [batch, pricePerNightWei],
        );
        console.log('Token booking transaction request', {
          to: Diamond.address,
          data: txData,
          bookingNights: batch,
          pricePerNightWei: pricePerNightWei.toString(),
          estimatedGas: gasSelection.estimatedGas.toString(),
          gasLimit: gasSelection.gasLimit.toString(),
          gasCeiling: gasCeiling.toString(),
          blockGasLimit: blockGasLimit.toString(),
          gasLimitSource: source,
        });

        setStakingProgress({
          completedNights,
          totalNights,
          requiresMultipleTransactions,
          phase: 'awaiting-wallet',
        });
        const transaction = await Diamond.signer.sendTransaction({
          to: Diamond.address,
          data: txData,
          gasLimit: gasSelection.gasLimit,
        });
        latestTransactionId = transaction.hash;
        console.log('Token booking transaction sent', {
          hash: transaction.hash,
          from: transaction.from,
          nonce: transaction.nonce,
          gasLimit: transaction.gasLimit?.toString(),
          chainId: transaction.chainId,
        });

        setStakingProgress({
          completedNights,
          totalNights,
          requiresMultipleTransactions,
          phase: 'confirming',
        });
        const receipt = await transaction.wait();
        if (receipt?.status !== 1) {
          return {
            error: new Error(BOOK_ACCOMMODATION_TX_REVERTED_PREFIX),
            success: null,
          };
        }

        const inspection = await inspectBookingReceipt({
          receipt,
          account,
          batch,
          pricePerNightWei,
          token: BLOCKCHAIN_DAO_TOKEN,
        });
        totalTransferLogCount += inspection.tdfTransferLogCount;
        totalSentFromWalletWei = totalSentFromWalletWei.add(
          inspection.tdfSentFromWalletWei,
        );

        console.log('Token booking transaction mined', {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          status: receipt.status,
          gasUsed: receipt.gasUsed?.toString(),
          estimatedGas: gasSelection.estimatedGas.toString(),
          gasLimit: gasSelection.gasLimit.toString(),
          blockGasLimit: blockGasLimit.toString(),
          nightCount: batch.length,
          pricePerNightWei: pricePerNightWei.toString(),
          expectedTotalWei: inspection.expectedTotalWei.toString(),
          expectedTotalTokens: utils.formatUnits(
            inspection.expectedTotalWei,
            inspection.decimals,
          ),
          tdfTransferLogCount: inspection.tdfTransferLogCount,
          tdfSentFromWalletWei: inspection.tdfSentFromWalletWei.toString(),
          tdfSentFromWallet: utils.formatUnits(
            inspection.tdfSentFromWalletWei,
            inspection.decimals,
          ),
          note:
            inspection.tdfTransferLogCount === 0
              ? 'No TDF Transfer logs: facet likely reused existing year stake / delta was zero; explorers show token transfers only when ERC-20 Transfer fires.'
              : undefined,
        });

        completedNights += batch.length;
        await publishProgress({ transactionId: transaction.hash });
        refetchBookingDates();
        updateWalletBalance();
      }

      setStakingProgress({
        completedNights,
        totalNights,
        requiresMultipleTransactions,
        phase: 'idle',
      });
      return {
        error: null,
        success: {
          transactionId: latestTransactionId,
          tdfTransferLogCount: totalTransferLogCount,
          tdfSentFromWalletWei: totalSentFromWalletWei.toString(),
          expectedTotalStakeWei: targetPricePerNightWei
            .mul(totalNights)
            .toString(),
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
      if (isBookingAlreadyExistsError(error)) {
        const coverageResult = await resolveStakeBookingCoverage(
          nights.slice(completedNights),
          targetPricePerNightWei,
        );
        if (coverageResult) return coverageResult;
      }
      return { error, success: null };
    } finally {
      setPending(false);
      setStakingProgress((current) => ({ ...current, phase: 'idle' }));
    }
  };

  return {
    stakeTokens,
    isStaking: isPending,
    stakingProgress,
    resetStakingProgress,
    checkContract,
  };
};
