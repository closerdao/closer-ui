import { parseMessageFromError } from './common';

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

export function formatStakeBookingErrorForUi(
  err: unknown,
  t: StakeBookingErrorTranslator,
): string {
  if (err == null) {
    return '';
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
