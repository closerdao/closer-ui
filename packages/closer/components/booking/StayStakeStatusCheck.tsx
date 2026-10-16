import { useEffect, useRef, useState } from 'react';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import type { Stay } from '../../types/stay';
import {
  formatStakeBookingErrorForUi,
  reportStakeBookingError,
  stakeErrorDetails,
} from '../../utils/stakeBookingError.helpers';
import { readPendingStayTransactionIds } from '../../utils/stayTokenStakePendingStorage';
import {
  hasLiveModificationPayment,
  stakeStayTokens,
  stayUsesTokenAccommodation,
} from '../../utils/stays.api';
import { ErrorMessage, Information } from '../ui';
import { Tooltip } from '../ui/InfoTooltip';
import { StakeErrorDetails } from './StakeErrorDetails';

export const canCheckStakeStatus = (
  stay: Stay,
  user:
    | { _id?: string; roles?: string[]; walletAddress?: string }
    | null
    | undefined,
  enabled: boolean,
) => {
  const owner = String(user?._id) === String(stay.createdBy);
  const host = user?.roles?.some((role: string) =>
    ['admin', 'space-host'].includes(role),
  );
  const liveModification = hasLiveModificationPayment(stay);
  const hasTokenPayment =
    stayUsesTokenAccommodation(stay) ||
    (stay.tokensStaked?.val ?? 0) > 0 ||
    (liveModification &&
      (stay.pendingModification?.quote?.tokensDelta ?? 0) > 0);
  const active =
    [
      'confirmed',
      'pending-payment',
      'tokens-staked',
      'credits-paid',
      'checked-in',
    ].includes(stay.status) ||
    (stay.status === 'paid' && liveModification);
  return Boolean(
    enabled &&
    active &&
    hasTokenPayment &&
    (owner || host) &&
    (stay.stakeVerificationAvailable === true ||
      (owner && Boolean(user?.walletAddress))),
  );
};

// Deliberately independent of the connected wallet, balances and local hashes.
export function StayStakeStatusCheck({
  stay,
  disabled = false,
  onChecked,
  onBusyChange,
}: {
  stay: Stay;
  disabled?: boolean;
  onChecked: (stay: Stay) => Promise<unknown> | void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const t = useTranslations();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const request = useRef<AbortController | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState('');
  useEffect(() => {
    active.current = false;
    setBusy(false);
    setMessage('');
    setError('');
    return () => {
      request.current?.abort();
      request.current = null;
      onBusyChange?.(false);
    };
  }, [stay._id, onBusyChange]);
  if (
    !canCheckStakeStatus(
      stay,
      user,
      process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true',
    )
  )
    return null;
  const check = async () => {
    if (active.current || disabled) return;
    active.current = true;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    onBusyChange?.(true);
    setError('');
    setMessage('');
    try {
      const result = await stakeStayTokens(stay._id, '', {
        syncBookingAlreadyOnChain: true,
        transactionIds: readPendingStayTransactionIds(stay._id),
        timeout: 30000,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const status =
        result.stakingStatus?.status ||
        (result.verified ? 'complete' : 'needs-review');
      setMessage(
        t(`stay_stake_check_${status.replace('-', '_')}`) +
          (result.stakingStatus?.refundReview
            ? ` ${t('stay_stake_check_refund_review')}`
            : ''),
      );
      await onChecked(result.booking);
    } catch (err) {
      if (controller.signal.aborted) return;
      setDetails(stakeErrorDetails(err));
      reportStakeBookingError(err, {
        bookingId: stay._id,
        stage: 'check_staking_status',
      });
      setError(
        formatStakeBookingErrorForUi(err, t) || t('stay_stake_check_failed'),
      );
    } finally {
      if (request.current === controller) {
        request.current = null;
        active.current = false;
        setBusy(false);
        onBusyChange?.(false);
      }
    }
  };
  return (
    <div className="contents">
      <Tooltip content={t('stay_stake_check_tooltip')} openOnClick={false}>
        <button
          type="button"
          aria-label={t('stay_stake_check_button')}
          aria-busy={busy}
          disabled={busy || disabled}
          onClick={check}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            aria-hidden="true"
            className={busy ? 'animate-spin motion-reduce:animate-none' : ''}
          />
        </button>
      </Tooltip>
      {(message || error) && (
        <div className="basis-full min-w-0 space-y-2 pt-1 text-left">
          {message && (
            <div role="status">
              <Information>{message}</Information>
            </div>
          )}
          {error && (
            <>
              <ErrorMessage error={error} />
              <StakeErrorDetails detail={details} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
