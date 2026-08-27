import { utils as ethersUtils } from 'ethers';

import {
  buildLaterYearStakeConflictError,
  detectLaterYearStakeConflict,
} from '../laterYearStakeConflict.helpers';
import {
  BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX,
  formatStakeBookingErrorEnglish,
  formatStakeBookingErrorForUi,
} from '../stakeBookingError.helpers';

const tdf = (value: string) => ethersUtils.parseUnits(value, 18);
const tm = (iso: string) => Math.floor(Date.parse(iso) / 1000);

const conflictError = () => {
  const conflict = detectLaterYearStakeConflict({
    deposits: [{ timestamp: tm('2027-01-01T00:00:00Z'), amount: tdf('2.6') }],
    yearEndTm: tm('2026-12-31T23:59:59Z'),
    pricePerNightWei: tdf('2'),
  });
  return buildLaterYearStakeConflictError(conflict!, 2026);
};

// Echoes back the key and interpolations so the test asserts on wiring, not copy.
const t = (key: string, values?: Record<string, unknown>) =>
  values ? `${key}|${JSON.stringify(values)}` : key;

describe('later-year stake conflict messaging', () => {
  it('renders the translated key with the amount and year', () => {
    expect(formatStakeBookingErrorForUi(conflictError(), t)).toBe(
      'stay_create_token_stake_later_year_conflict|{"amount":"2.60","year":"2026"}',
    );
  });

  it('renders an English explanation naming the amount and the remedy', () => {
    const message = formatStakeBookingErrorEnglish(conflictError());
    expect(message).toContain('2.60 $TDF');
    expect(message).toContain('2026');
    expect(message).toContain('Cancel those later bookings first');
  });

  it('still maps a plain balance revert to the insufficient balance key', () => {
    const err = new Error(
      'execution reverted: ERC20: transfer amount exceeds balance',
    );
    expect(formatStakeBookingErrorForUi(err, t)).toBe(
      'error_insufficient_token_balance',
    );
  });

  it('still maps a wallet rejection', () => {
    expect(
      formatStakeBookingErrorForUi({ code: 4001, message: 'User denied' }, t),
    ).toBe('stay_create_stake_error_user_rejected');
  });

  it('maps an existing accommodation conflict to its localized message', () => {
    const error = new Error(BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX);
    expect(formatStakeBookingErrorForUi(error, t)).toBe(
      'stay_create_token_stake_existing_conflict',
    );
    expect(formatStakeBookingErrorEnglish(error)).toContain(
      'token lock already exists',
    );
  });

  it('returns an empty string for a null error', () => {
    expect(formatStakeBookingErrorForUi(null, t)).toBe('');
  });
});
