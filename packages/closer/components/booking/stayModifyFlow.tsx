import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { CloserCurrencies } from '../../types/currency';
import type {
  PendingModification,
  Stay,
  StayModificationRefund,
} from '../../types/stay';
import {
  getBookingPaymentCheckoutPath,
  getPropertyCalendarDay,
} from '../../utils/booking.helpers';
import { parseMessageFromError } from '../../utils/common';
import { priceFormat } from '../../utils/helpers';
import {
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  confirmStayModification,
  discardStayModification,
  getStayModification,
  proposeStayModification,
} from '../../utils/stays.api';
import BookingGuests from '../BookingGuests';
import { Button, Information } from '../ui';
import Heading from '../ui/Heading';
import BookingSurface from './bookingSurface';

const FIAT_EPSILON = 0.005;

interface Props {
  stay: Stay;
  timeZone?: string;
  /** False for a space-host or admin settling someone else's change: they
   * approve it, they do not pay for it. */
  isBookingOwner?: boolean;
  onStayChange: (stay: Stay) => void | Promise<void>;
}

const isLiveHold = (pending: PendingModification | null | undefined) => {
  if (!pending?.id) return false;
  if (!pending.expiresAt) return true;
  return new Date(pending.expiresAt).getTime() > Date.now();
};

const StayModifyFlow = ({
  stay,
  timeZone,
  isBookingOwner = true,
  onStayChange,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const confirmedStart = getPropertyCalendarDay(timeZone, stay.start) || '';
  const confirmedEnd = getPropertyCalendarDay(timeZone, stay.end) || '';

  const [pending, setPending] = useState<PendingModification | null>(
    isLiveHold(stay.pendingModification) ? stay.pendingModification! : null,
  );
  const [start, setStart] = useState(confirmedStart);
  const [end, setEnd] = useState(confirmedEnd);
  const [adults, setAdults] = useState(stay.adults ?? 1);
  const [children, setChildren] = useState(stay.children ?? 0);
  const [infants, setInfants] = useState(stay.infants ?? 0);
  const [pets, setPets] = useState(stay.pets ?? 0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refund, setRefund] = useState<StayModificationRefund | null>(null);

  // A checkout hold the guest abandoned reads as gone here, so a reload lands
  // on the editor rather than on a quote nobody can settle.
  useEffect(() => {
    let cancelled = false;
    getStayModification(stay._id)
      .then((live) => {
        if (!cancelled) setPending(isLiveHold(live) ? live : null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [stay._id]);

  const quote = pending?.quote;
  const newTotal = quote?.priceLockPreview?.total;
  const currency = (quote?.currency ||
    newTotal?.cur ||
    'EUR') as CloserCurrencies;
  const fiatDelta = Number(quote?.fiatDelta ?? 0);
  const paidVal = Number(newTotal?.val ?? 0) - fiatDelta;
  const settlesAsHost = !isBookingOwner;
  // Only the guest who owes the delta is sent to pay it; a host approving
  // gets the guest there through the edited-needs-payment mail instead.
  const needsPayment = fiatDelta > FIAT_EPSILON && !settlesAsHost;
  const waitingForHost = pending?.status === 'pending-approval';

  const hasChange = useMemo(
    () =>
      start !== confirmedStart ||
      end !== confirmedEnd ||
      adults !== (stay.adults ?? 1) ||
      children !== (stay.children ?? 0) ||
      infants !== (stay.infants ?? 0) ||
      pets !== (stay.pets ?? 0),
    [
      start,
      end,
      adults,
      children,
      infants,
      pets,
      confirmedStart,
      confirmedEnd,
      stay.adults,
      stay.children,
      stay.infants,
      stay.pets,
    ],
  );

  const run = useCallback(async (action: () => Promise<void>) => {
    setIsBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsBusy(false);
    }
  }, []);

  const handlePropose = () =>
    run(async () => {
      const updated = await proposeStayModification(stay._id, {
        start,
        end,
        adults,
        children,
        infants,
        pets,
      });
      setPending(updated.pendingModification ?? null);
      setRefund(null);
      await onStayChange(updated);
    });

  const handleConfirm = () =>
    run(async () => {
      const result = await confirmStayModification(stay._id);
      setPending(null);
      await onStayChange(result.stay);
      if (needsPayment) {
        await router.push(
          getBookingPaymentCheckoutPath({
            bookingId: result.stay._id,
            status: String(result.stay.status ?? ''),
            paymentDelta: result.stay.paymentDelta,
            useTokens: result.stay.useTokens,
            fiatOwed: computeFiatOwed(result.stay),
            tokensOwed: computeTokensOwed(result.stay),
            creditsOwed: computeCreditsOwed(result.stay),
          }),
        );
        return;
      }
      setRefund(result.refund);
    });

  const handleDiscard = () =>
    run(async () => {
      const updated = await discardStayModification(stay._id);
      setPending(null);
      setRefund(null);
      setStart(confirmedStart);
      setEnd(confirmedEnd);
      await onStayChange(updated);
    });

  const errorBlock = error && (
    <Information className="border-error/30 bg-error/10 text-foreground">
      {error}
    </Information>
  );

  const refundedVal = Number(
    refund?.stripe?.refundedVal ?? refund?.refundVal ?? 0,
  );
  const refundBlock = refund && (
    <BookingSurface tone="banner" padding="sm" className="text-sm">
      {refundedVal > 0
        ? t('stay_modify_refunded', {
            amount: priceFormat(refundedVal, currency),
          })
        : t('stay_modify_no_refund')}
    </BookingSurface>
  );

  if (pending) {
    return (
      <BookingSurface
        tone="elevated"
        padding="md"
        className="flex flex-col gap-3"
      >
        <Heading level={4} className="!mt-0 text-base font-semibold">
          {t('stay_modify_quote_title')}
        </Heading>

        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt>{t('stay_modify_paid')}</dt>
            <dd>{priceFormat(paidVal, currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>{t('stay_modify_new_total')}</dt>
            <dd>{priceFormat(Number(newTotal?.val ?? 0), currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 font-semibold">
            <dt>
              {needsPayment
                ? t('stay_modify_delta_to_pay')
                : t('stay_modify_delta_back')}
            </dt>
            <dd>{priceFormat(Math.abs(fiatDelta), currency)}</dd>
          </div>
          {Math.abs(Number(quote?.tokensDelta ?? 0)) > 0 && (
            <div className="flex justify-between gap-4">
              <dt>{t('stay_modify_delta_tokens')}</dt>
              <dd>{Number(quote?.tokensDelta)}</dd>
            </div>
          )}
          {Math.abs(Number(quote?.creditsDelta ?? 0)) > 0 && (
            <div className="flex justify-between gap-4">
              <dt>{t('stay_modify_delta_credits')}</dt>
              <dd>{Number(quote?.creditsDelta)}</dd>
            </div>
          )}
        </dl>

        {waitingForHost && (
          <BookingSurface tone="banner" padding="sm" className="text-sm">
            {t('stay_modify_waiting_for_host')}
          </BookingSurface>
        )}

        {errorBlock}

        <div className="flex flex-col gap-2 sm:flex-row">
          {(!waitingForHost || settlesAsHost) && (
            <Button
              variant="secondary"
              isLoading={isBusy}
              onClick={() => void handleConfirm()}
            >
              {settlesAsHost
                ? t('stay_modify_host_approve')
                : needsPayment
                  ? t('stay_modify_pay_delta', {
                      amount: priceFormat(fiatDelta, currency),
                    })
                  : t('stay_modify_confirm')}
            </Button>
          )}
          <Button
            variant="secondary"
            isLoading={isBusy}
            onClick={() => void handleDiscard()}
          >
            {t('stay_modify_discard')}
          </Button>
        </div>
      </BookingSurface>
    );
  }

  return (
    <BookingSurface
      tone="elevated"
      padding="md"
      className="flex flex-col gap-3"
    >
      <Heading level={4} className="!mt-0 text-base font-semibold">
        {t('stay_modify_title')}
      </Heading>

      {refundBlock}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          {t('stay_modify_checkin')}
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-sm">
          {t('stay_modify_checkout')}
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            type="date"
            min={start}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>

      <BookingGuests
        shouldHideTitle
        adults={adults}
        kids={children}
        infants={infants}
        pets={pets}
        setAdults={setAdults}
        setKids={setChildren}
        setInfants={setInfants}
        setPets={setPets}
      />

      {errorBlock}

      <Button
        variant="secondary"
        isLoading={isBusy}
        isEnabled={hasChange && Boolean(start) && Boolean(end)}
        onClick={() => void handlePropose()}
      >
        {t('stay_modify_review')}
      </Button>
    </BookingSurface>
  );
};

export default StayModifyFlow;
