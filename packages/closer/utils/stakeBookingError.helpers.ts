import { parseMessageFromError } from './common';

const ACCOMMODATION_YEAR_NOT_ACTIVE_PREFIX = 'ACCOMMODATION_YEAR_NOT_ACTIVE:';

export const BOOK_ACCOMMODATION_TX_REVERTED_PREFIX =
  'BOOK_ACCOMMODATION_TX_REVERTED:';

export function formatStakeBookingErrorEnglish(err: unknown): string {
  const m =
    err && typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : '';
  if (m.startsWith(ACCOMMODATION_YEAR_NOT_ACTIVE_PREFIX)) {
    const year = m.slice(ACCOMMODATION_YEAR_NOT_ACTIVE_PREFIX.length);
    return `Token booking is not enabled on-chain for calendar year ${year}. An admin may need to enable accommodation bookings for that year in the DAO contract.`;
  }
  if (m.startsWith(BOOK_ACCOMMODATION_TX_REVERTED_PREFIX)) {
    return 'The on-chain stake transaction was mined but reverted. No tokens were locked for these nights. Check the transaction in your wallet’s block explorer, or confirm allowance, balance, and that token booking is enabled for this year.';
  }
  return parseMessageFromError(err);
}

export function formatStakeBookingErrorForUi(
  err: unknown,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const m =
    err && typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : '';
  if (m.startsWith(ACCOMMODATION_YEAR_NOT_ACTIVE_PREFIX)) {
    const year = m.slice(ACCOMMODATION_YEAR_NOT_ACTIVE_PREFIX.length);
    return t('stay_create_token_stake_year_not_active', { year });
  }
  if (m.startsWith(BOOK_ACCOMMODATION_TX_REVERTED_PREFIX)) {
    return t('stay_create_token_stake_tx_reverted');
  }
  return parseMessageFromError(err);
}
