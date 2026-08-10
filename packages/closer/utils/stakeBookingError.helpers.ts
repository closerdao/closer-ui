import { parseMessageFromError } from './common';

const ACCOMMODATION_YEAR_NOT_ACTIVE_PREFIX = 'ACCOMMODATION_YEAR_NOT_ACTIVE:';

export const BOOK_ACCOMMODATION_TX_REVERTED_PREFIX =
  'BOOK_ACCOMMODATION_TX_REVERTED:';

export type StakeBookingErrorTranslator = (
  key: string,
  values?: Record<string, string | number | boolean | Date | null | undefined>,
) => string;

const sanitizeIntlPlaceholder = (value: string, maxLen: number): string =>
  value.replace(/[{}]/g, ' ').slice(0, maxLen).trim();

const isUserRejectedWalletError = (err: unknown, messageLower: string): boolean => {
  if (
    /user denied|user rejected|rejected the request|reject this request|action_rejected/i.test(
      messageLower,
    )
  ) {
    return true;
  }
  const code = (err as { code?: string | number })?.code;
  if (code === 4001 || code === 'ACTION_REJECTED') {
    return true;
  }
  return false;
};

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
  t: StakeBookingErrorTranslator,
): string {
  if (err == null) {
    return '';
  }

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

  const raw = parseMessageFromError(err as Parameters<typeof parseMessageFromError>[0]);
  const lower = raw.toLowerCase();

  if (isUserRejectedWalletError(err, lower)) {
    return t('stay_create_stake_error_user_rejected');
  }

  if (
    lower.includes('exceeds balance') ||
    lower.includes('transfer amount exceeds') ||
    lower.includes('erc20:') ||
    lower.includes('insufficient balance')
  ) {
    return t('error_insufficient_token_balance');
  }

  if (lower.includes('insufficient funds') && lower.includes('gas')) {
    return t('insufficient_celo_for_gas');
  }

  if (raw && raw.trim() && raw !== 'Something went wrong') {
    return t('stay_create_stake_error_detail', {
      message: sanitizeIntlPlaceholder(raw, 400),
    });
  }

  return '';
}
