import { BigNumber } from 'ethers';

/**
 * Detects the on-chain condition that makes `bookAccommodation` revert with a
 * Solidity panic 0x11 (arithmetic underflow).
 *
 * `StakeLibV2.handleBooking` does:
 *
 *   uint256 nextYearsBalance = store.balanceFrom(context.endYearTm);
 *   if (nextYearsBalance >= context.requiredBalance) return;
 *   uint256 required = amount;      // amount == price for ONE night
 *   required -= nextYearsBalance;   // <-- underflows
 *
 * `nextYearsBalance` is the whole stake ledger dated after the end of the year
 * being booked, while `amount` is a single night's price. When a member already
 * has stake locked for nights in a later year, and that stake is larger than the
 * per-night price of the booking they are making now, the subtraction underflows
 * and every night of the new booking reverts.
 *
 * The frontend cannot fix the arithmetic, so it detects the condition and
 * explains it instead of sending a transaction that can only fail.
 */

export const LATER_YEAR_STAKE_CONFLICT_PREFIX = 'LATER_YEAR_STAKE_CONFLICT:';

export interface StakeDeposit {
  timestamp: BigNumber | number | string;
  amount: BigNumber | number | string;
}

export interface LaterYearStakeConflict {
  /** Total wei staked with a timestamp after the end of the booked year. */
  laterYearStakeWei: BigNumber;
  /** Per-night price the booking would use, in wei. */
  pricePerNightWei: BigNumber;
}

const toBigNumber = (value: BigNumber | number | string): BigNumber | null => {
  try {
    if (BigNumber.isBigNumber(value)) return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      return BigNumber.from(Math.trunc(value));
    }
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    return BigNumber.from(trimmed);
  } catch {
    return null;
  }
};

/**
 * Sums the stake deposits dated strictly after `yearEndTm`, mirroring
 * `OrderedStakeLib.balanceFrom(endYearTm)`.
 */
export const sumStakeAfter = (
  deposits: StakeDeposit[] | null | undefined,
  yearEndTm: BigNumber | number | string,
): BigNumber => {
  const end = toBigNumber(yearEndTm);
  if (!end || !Array.isArray(deposits)) return BigNumber.from(0);

  return deposits.reduce((total, deposit) => {
    const timestamp = toBigNumber(deposit?.timestamp);
    const amount = toBigNumber(deposit?.amount);
    if (!timestamp || !amount) return total;
    return timestamp.gt(end) ? total.add(amount) : total;
  }, BigNumber.from(0));
};

/**
 * Returns the conflict when the contract would underflow, or `null` when the
 * booking can proceed.
 */
export const detectLaterYearStakeConflict = ({
  deposits,
  yearEndTm,
  pricePerNightWei,
}: {
  deposits: StakeDeposit[] | null | undefined;
  yearEndTm: BigNumber | number | string;
  pricePerNightWei: BigNumber | number | string;
}): LaterYearStakeConflict | null => {
  const price = toBigNumber(pricePerNightWei);
  if (!price || price.isZero()) return null;

  const laterYearStakeWei = sumStakeAfter(deposits, yearEndTm);
  if (!laterYearStakeWei.gt(price)) return null;

  return { laterYearStakeWei, pricePerNightWei: price };
};

/**
 * Encodes the conflict into an error message the UI layer decodes into a
 * translated, actionable explanation.
 */
export const buildLaterYearStakeConflictError = (
  conflict: LaterYearStakeConflict,
  bookingYear: number,
): Error =>
  new Error(
    `${LATER_YEAR_STAKE_CONFLICT_PREFIX}${conflict.laterYearStakeWei.toString()}:${bookingYear}`,
  );

export const parseLaterYearStakeConflictError = (
  message: string,
): { laterYearStakeWei: string; bookingYear: string } | null => {
  if (!message.startsWith(LATER_YEAR_STAKE_CONFLICT_PREFIX)) return null;
  const [laterYearStakeWei, bookingYear] = message
    .slice(LATER_YEAR_STAKE_CONFLICT_PREFIX.length)
    .split(':');
  if (!laterYearStakeWei || !bookingYear) return null;
  return { laterYearStakeWei, bookingYear };
};
