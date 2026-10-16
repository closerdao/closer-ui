import { utils as ethersUtils } from 'ethers';

import { parseMessageFromError } from './common';
import { parseLaterYearStakeConflictError } from './laterYearStakeConflict.helpers';
import { trackEvent } from './posthog';

export const stakeErrorDetails = (err: unknown): string => {
  const seen = new Set<unknown>();
  const messages: string[] = [];
  const visit = (value: any, depth = 0) => {
    if (!value || depth > 4 || seen.has(value)) return;
    seen.add(value);
    if (typeof value === 'string') {
      messages.push(value);
      return;
    }
    if (typeof value !== 'object') return;
    for (const key of ['reason', 'shortMessage', 'message']) {
      if (typeof value[key] === 'string') messages.push(value[key]);
    }
    visit(value.error, depth + 1);
    visit(value.cause, depth + 1);
    visit(value.data?.message, depth + 1);
    visit(value.response?.data?.error, depth + 1);
  };
  visit(err);
  return [...new Set(messages)]
    .join(' | ')
    .replace(/https?:\/\/[^\s"')]+/gi, '[RPC URL removed]')
    .replace(
      /["']?(?:authorization|bearer|api[_-]?key|token|password|secret)["']?\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi,
      '[credential removed]',
    )
    .replace(/Bearer\s+[^\s,;}]+/gi, '[credential removed]')
    .replace(/0x[0-9a-f]{128,}/gi, '[transaction data removed]')
    .replace(/[\u0000-\u001f]/g, ' ')
    .slice(0, 1200);
};

export const reportStakeBookingError = (
  err: unknown,
  context: {
    bookingId: string;
    stage: string;
    requestedWei?: string;
    transactionId?: string;
  },
) => {
  const detail = stakeErrorDetails(err);
  const rejected = isUserRejectedWalletError(err, detail.toLowerCase());
  // Explicit capture: these exceptions are handled, so browser autocapture
  // alone cannot recover them. Never send the provider's request/config object.
  trackEvent(rejected ? 'stay_stake_cancelled' : 'stay_stake_error', {
    booking_id: context.bookingId.slice(0, 64),
    stage: context.stage.slice(0, 64),
    error_detail: detail,
    error_code: String(
      (err as any)?.code || (err as any)?.response?.data?.details?.code || '',
    ).slice(0, 80),
    ...(context.requestedWei && /^\d{1,78}$/.test(context.requestedWei)
      ? { requested_wei: context.requestedWei }
      : {}),
    ...(context.transactionId && /^0x[0-9a-f]{64}$/i.test(context.transactionId)
      ? { transaction_id: context.transactionId }
      : {}),
  });
};

const ACCOMMODATION_YEAR_NOT_ACTIVE_PREFIX = 'ACCOMMODATION_YEAR_NOT_ACTIVE:';

export const BOOK_ACCOMMODATION_TX_REVERTED_PREFIX =
  'BOOK_ACCOMMODATION_TX_REVERTED:';

export const BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX =
  'BOOK_ACCOMMODATION_EXISTING_CONFLICT:';

/** The wallet already holds some of these nights on chain; retrying cannot succeed. */
export const isExistingStakeConflictError = (err: unknown): boolean =>
  err instanceof Error &&
  err.message.startsWith(BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX);

export type StakeBookingErrorTranslator = (
  key: string,
  values?: Record<string, string | number | boolean | Date | null | undefined>,
) => string;

const formatTokensFromWei = (wei: string): string => {
  try {
    const formatted = Number(ethersUtils.formatUnits(wei, 18));
    if (!Number.isFinite(formatted)) return wei;
    return formatted.toFixed(2);
  } catch {
    return wei;
  }
};

const isUserRejectedWalletError = (
  err: unknown,
  messageLower: string,
): boolean => {
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
  if (m.startsWith(BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX)) {
    return 'This wallet already has tokens locked for some of these nights, and the contract allows one lock per night, so staking again will not work. Pay accommodation for this stay in fiat instead, or contact support if that lock is not yours.';
  }
  const laterYearConflict = parseLaterYearStakeConflictError(m);
  if (laterYearConflict) {
    const amount = formatTokensFromWei(laterYearConflict.laterYearStakeWei);
    return `You already have ${amount} $TDF locked on-chain for nights after ${laterYearConflict.bookingYear}. The booking contract cannot stake ${laterYearConflict.bookingYear} nights while a larger amount is locked for a later year. Cancel those later bookings first, then stake these nights again.`;
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
  if ((err as { code?: string })?.code === 'TOKEN_STAKE_VERIFICATION_DELAYED') {
    return t('stay_create_token_stake_verification_delayed');
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
  if (m.startsWith(BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX)) {
    return t('stay_create_token_stake_existing_conflict');
  }

  const laterYearConflict = parseLaterYearStakeConflictError(m);
  if (laterYearConflict) {
    return t('stay_create_token_stake_later_year_conflict', {
      amount: formatTokensFromWei(laterYearConflict.laterYearStakeWei),
      year: laterYearConflict.bookingYear,
    });
  }

  const raw = stakeErrorDetails(err);
  const lower = raw.toLowerCase();

  if (isUserRejectedWalletError(err, lower)) {
    return t('stay_create_stake_error_user_rejected');
  }

  if (
    /insufficient allowance|exceeds allowance|erc20insufficientallowance/.test(
      lower,
    )
  ) {
    return t('stay_stake_error_allowance');
  }
  if (
    /transfer amount exceeds balance|insufficient (?:token )?balance|erc20insufficientbalance/.test(
      lower,
    )
  ) {
    return t('error_insufficient_token_balance');
  }

  if (lower.includes('insufficient funds') && lower.includes('gas')) {
    return t('insufficient_celo_for_gas');
  }
  if (
    /past|must be future|date.*future|deadline.*passed|date.*expired/.test(
      lower,
    )
  ) {
    return t('stay_stake_error_deadline');
  }
  if (
    (err as any)?.response?.data?.details?.code ===
      'TOKEN_STAKE_VERIFICATION_PENDING' ||
    /timeout|network error|temporarily unavailable/.test(lower)
  )
    return t('stay_create_token_stake_verification_delayed');
  if (/execution reverted|call_exception/.test(lower))
    return t('stay_stake_error_reverted');
  return t('stay_stake_error_unknown');
}
