import type { ReactNode } from 'react';

import dayjs from 'dayjs';
import { Check, Clock, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import type { Charge } from '../../types/booking';
import type { Stay, StayMoney } from '../../types/stay';
import {
  getDefaultCurrencyLocale,
  isIso4217Currency,
} from '../../utils/currencyFormat';
import { normalizeDiscountCode } from '../../utils/discountCode';
import {
  FIAT_EPSILON,
  awaitsHeldStake,
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  formatStakeNights,
  formatStayMoney,
  hasLiveModificationPayment,
  splitStayAdjustment,
} from '../../utils/stays.api';
import { getStayEventTicketDiscount } from '../../utils/tickets.helpers';
import StayVatSummary from '../StayVatSummary';
import InfoTooltip from '../ui/InfoTooltip';
import { StayUnstakedNightsInfo } from './StayTokenPaymentSummary';
import { BookingSurfaceDivider } from './bookingSurface';
import { StayAccommodationDiscountSummary } from './stayAccommodationDiscountSummary';

type LegacyCosts = Partial<
  Record<
    | 'accommodation'
    | 'utility'
    | 'food'
    | 'event'
    | 'total'
    | 'tokens'
    | 'credits',
    StayMoney
  >
>;

// These strings are for presentation only; payment decisions use the original amounts.
function usePaymentAmount() {
  const t = useTranslations();
  return (money: StayMoney) => {
    if (isIso4217Currency(money.cur.toUpperCase()))
      return formatStayMoney({ ...money, cur: money.cur.toUpperCase() });
    const amount = new Intl.NumberFormat(getDefaultCurrencyLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits:
        Math.abs(money.val) > 0 && Math.abs(money.val) < 0.01 ? 6 : 2,
    }).format(money.val);
    return money.cur === 'credits'
      ? t('stay_payment_credit_amount', { amount })
      : `${amount} ${money.cur}`;
  };
}

function CostRow({
  label,
  amount,
  children,
}: {
  label: ReactNode;
  amount: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="min-w-0 flex items-center flex-wrap gap-x-1">
        {label}
        {children}
      </dt>
      <dd className="min-w-0 text-right tabular-nums font-medium">{amount}</dd>
    </div>
  );
}

function NightlyCostInfo({
  stay,
  amount,
  label,
}: {
  stay: Stay;
  amount: StayMoney;
  label: string;
}) {
  const t = useTranslations();
  if (
    stay.isHourlyBooking ||
    stay.isDayTicket ||
    !Number.isFinite(stay.duration) ||
    stay.duration <= 0
  )
    return null;
  return (
    <InfoTooltip label={t('stay_payment_cost_info', { label })}>
      {t('stay_payment_nightly_average', {
        total: formatStayMoney(amount),
        nights: stay.duration,
        average: formatStayMoney({
          ...amount,
          val: amount.val / stay.duration,
        }),
      })}
    </InfoTooltip>
  );
}

/** Shared read-only view of a persisted booking; never quotes or reconciles it. */
export function StayPaymentSummary({
  stay,
  legacyCosts = {},
  tokenActions,
  awaitingApprovalNote,
  eventTicketOptions,
  children,
}: {
  stay: Stay;
  legacyCosts?: LegacyCosts;
  tokenActions?: ReactNode;
  /** The event's ticket options, to show what a discount code took off. */
  eventTicketOptions?:
    { name: string; price?: number; currency?: string }[] | null;
  /** Replaces the balance on a booking nobody can pay yet (draft or awaiting approval). */
  awaitingApprovalNote?: string;
  children?: ReactNode;
}) {
  const t = useTranslations();
  const amount = usePaymentAmount();
  const lock = stay.priceLock;
  const fiat = stay.fiatTarget ?? lock?.total ?? legacyCosts.total;
  const currency = fiat?.cur ?? 'EUR';
  const tokens =
    stay.tokensTarget ??
    lock?.appliedTokens ??
    stay.appliedTokens ??
    legacyCosts.tokens;
  const credits =
    stay.creditsTarget ??
    lock?.appliedCredits ??
    stay.appliedCredits ??
    legacyCosts.credits;
  const held = hasLiveModificationPayment(stay);
  const quote = held ? stay.pendingModification?.quote : undefined;
  const confirmed: Stay = {
    ...stay,
    pendingModification: null,
    fiatTarget: stay.fiatTarget ?? (stay.paymentDelta?.fiat ? undefined : fiat),
    tokensTarget: tokens,
    creditsTarget: credits,
  };
  const hasSettlement = Boolean(
    stay.fiatTarget ||
    stay.tokensTarget ||
    stay.creditsTarget ||
    stay.paymentDelta ||
    lock,
  );
  const fiatDue =
    held || hasSettlement
      ? computeFiatOwed({
          ...confirmed,
          pendingModification: stay.pendingModification,
        })
      : 0;
  const tokensDue = computeTokensOwed({
    ...confirmed,
    pendingModification: stay.pendingModification,
  });
  const creditsDue = computeCreditsOwed({
    ...confirmed,
    pendingModification: stay.pendingModification,
  });
  const fiatBalance =
    stay.fiatTarget || lock?.total
      ? (fiat?.val ?? 0) - (stay.fiatPaid?.val ?? 0)
      : (stay.paymentDelta?.fiat?.val ??
        (fiat?.val ?? 0) - (stay.fiatPaid?.val ?? 0));
  const refundDue = held ? 0 : Math.max(0, -fiatBalance);
  const hasDue = fiatDue > FIAT_EPSILON || tokensDue > 0 || creditsDue > 0;
  const inactive = [
    'cancelled',
    'rejected',
    'draft',
    'open',
    'pending',
  ].includes(stay.status);
  // Nothing is payable before approval, so a balance here would read as a bill.
  const isAwaitingApproval =
    !held && ['draft', 'open', 'pending'].includes(stay.status);
  const isFullyPaid =
    stay.status === 'paid' &&
    !held &&
    !hasDue &&
    hasSettlement &&
    !inactive &&
    refundDue <= FIAT_EPSILON;
  const lines = lock?.lines ?? legacyCosts;
  const adjustment = splitStayAdjustment(lock?.lines.adjustment);
  const converted = lock?.lines.adjustment?.unstakedNights;
  const eventTokens = lock?.lines.eventToken;
  const eventDiscountCode = normalizeDiscountCode(stay.eventDiscount);
  // Only a saved code explains a lower price; a later list-price change must not read as a discount.
  const eventDiscount = eventDiscountCode
    ? getStayEventTicketDiscount({
        eventLine: lines.event,
        ticketName: stay.ticketOption?.name,
        ticketOptions: eventTicketOptions,
        discountCode: eventDiscountCode,
        ticketCount: stay.adults,
      })
    : null;
  const totals = [fiat, tokens, credits].filter((value): value is StayMoney =>
    Boolean(value && value.val > 0),
  );
  const rails = [
    {
      key: 'fiat',
      target: fiat,
      paid: stay.fiatPaid,
      due: computeFiatOwed(confirmed),
      epsilon: FIAT_EPSILON,
      label: currency,
      verb: 'stay_payment_paid_amount',
    },
    {
      key: 'tokens',
      target: tokens,
      paid: stay.tokensStaked,
      due: computeTokensOwed(confirmed),
      epsilon: 0,
      label: tokens?.cur ?? 'TDF',
      verb: 'stay_payment_staked_amount',
    },
    {
      key: 'credits',
      target: credits,
      paid: stay.creditsPaid,
      due: computeCreditsOwed(confirmed),
      epsilon: 0,
      label: t('stay_payment_credits_label'),
      verb: 'stay_payment_redeemed_amount',
    },
  ].filter((rail) => (rail.target?.val ?? 0) > 0 || (rail.paid?.val ?? 0) > 0);
  const showPaymentStatus =
    !isAwaitingApproval || rails.some((rail) => (rail.paid?.val ?? 0) > 0);
  const dueAmounts = [
    fiatDue > FIAT_EPSILON
      ? { val: fiatDue, cur: quote?.currency ?? currency }
      : null,
    tokensDue > 0 ? { val: tokensDue, cur: tokens?.cur ?? 'TDF' } : null,
    creditsDue > 0 ? { val: creditsDue, cur: 'credits' } : null,
  ].filter((value): value is StayMoney => value !== null);

  // The quote is a delta, so its sign says whether the change costs or returns.
  const tokenCur = tokens?.cur ?? 'TDF';
  const quoteRows = quote
    ? [
        {
          key: 'fiat',
          val: quote.fiatDelta,
          cur: quote.currency,
          label: t(
            quote.fiatDelta < 0
              ? 'stay_payment_change_fiat_refund'
              : 'stay_payment_change_fiat_due',
            { currency: quote.currency },
          ),
        },
        {
          key: 'tokens',
          val: quote.tokensDelta ?? 0,
          cur: tokenCur,
          label: t(
            (quote.tokensDelta ?? 0) < 0
              ? 'stay_payment_change_tokens_released'
              : 'stay_payment_change_tokens_due',
            { currency: tokenCur },
          ),
        },
        {
          key: 'credits',
          val: quote.creditsDelta ?? 0,
          cur: 'credits',
          label: t(
            (quote.creditsDelta ?? 0) < 0
              ? 'stay_payment_change_credits_returned'
              : 'stay_payment_change_credits_due',
          ),
        },
      ].filter((row, index, all) =>
        // Keep the money row when nothing else changes, so the box is never empty.
        row.val ? true : row.key === 'fiat' && all.every((other) => !other.val),
      )
    : [];

  return (
    <div
      className="space-y-5 text-sm text-foreground"
      data-testid="stay-payment-summary"
    >
      <section
        aria-label={t('stay_payment_cost_breakdown')}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-semibold">
            {t('stay_create_line_accommodation')}
          </h3>
          {lock && (
            <StayAccommodationDiscountSummary
              priceLock={lock}
              variant="badge"
            />
          )}
        </div>
        <dl className="space-y-2 pl-3 border-l-2 border-foreground/10">
          {lines.accommodation &&
            (lines.accommodation.val !== 0 ||
              !(tokens?.val || credits?.val)) && (
              <CostRow
                label={t('stay_payment_currency_portion', { currency })}
                amount={amount(lines.accommodation)}
              />
            )}
          {!!tokens?.val && (
            <CostRow
              label={t('stay_payment_currency_portion', {
                currency: tokens.cur,
              })}
              amount={amount(tokens)}
            />
          )}
          {!!credits?.val && (
            <CostRow
              label={t('stay_payment_credits_portion')}
              amount={amount(credits)}
            />
          )}
          {converted && (
            <CostRow
              label={t('stay_line_unstaked_nights', {
                nights: formatStakeNights(converted.nights),
              })}
              amount={
                converted.waived ? t('stay_payment_waived') : amount(converted)
              }
            >
              <StayUnstakedNightsInfo stay={stay} />
            </CostRow>
          )}
        </dl>
        <dl className="space-y-3">
          {(['utility', 'food'] as const).map((key) => {
            const cost = lines[key];
            const label = t(`stay_create_line_${key}`);
            return cost && cost.val > 0 ? (
              <CostRow
                key={key}
                label={<span className="font-semibold">{label}</span>}
                amount={amount(cost)}
              >
                <NightlyCostInfo stay={stay} amount={cost} label={label} />
              </CostRow>
            ) : null;
          })}
          {lines.event &&
            (lines.event.val !== 0 ||
              (stay.eventId && !(eventTokens && eventTokens.val > 0))) && (
              <CostRow
                label={t('stay_create_line_event')}
                amount={
                  lines.event.val === 0 ? (
                    t('stay_payment_included')
                  ) : eventDiscount ? (
                    <>
                      <s className="mr-2 font-normal text-muted-foreground">
                        {amount(eventDiscount.gross)}
                      </s>
                      {amount(lines.event)}
                    </>
                  ) : (
                    amount(lines.event)
                  )
                }
              >
                {eventDiscount && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent-light/70 px-2.5 py-1 text-xs font-medium text-accent-dark">
                    {t('ticket_list_discount_with_code', {
                      code: eventDiscount.code,
                    })}
                    <span className="tabular-nums">
                      −{amount(eventDiscount.savings)}
                    </span>
                  </span>
                )}
              </CostRow>
            )}
          {eventTokens && eventTokens.val > 0 && (
            <CostRow
              label={t('stay_create_line_event')}
              amount={amount(eventTokens)}
            >
              <span className="basis-full text-xs text-muted-foreground">
                {t('stay_payment_event_tokens_note')}
              </span>
            </CostRow>
          )}
          {adjustment.host && (
            <CostRow
              label={t('stay_create_line_adjustment')}
              amount={amount(adjustment.host)}
            />
          )}
        </dl>
      </section>

      <BookingSurfaceDivider />
      <section
        className="space-y-2"
        aria-label={t('stay_payment_booking_total')}
      >
        <dl className="text-base font-semibold">
          <CostRow
            label={t('stay_payment_booking_total')}
            amount={
              totals.length ? (
                <span className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
                  {totals.map((value, index) => (
                    <span
                      key={value.cur}
                      className="inline-flex items-baseline gap-2 whitespace-nowrap"
                    >
                      {index > 0 && (
                        <span
                          aria-hidden="true"
                          className="font-normal text-muted-foreground"
                        >
                          ·
                        </span>
                      )}
                      <span>{amount(value)}</span>
                    </span>
                  ))}
                </span>
              ) : fiat ? (
                amount(fiat)
              ) : (
                '—'
              )
            }
          />
        </dl>
        {lock && <StayVatSummary priceLock={lock} collapsible />}
      </section>

      {showPaymentStatus && (
        <section
          className="space-y-3"
          aria-label={t('stay_payment_status')}
          aria-live="polite"
        >
          <h3 className="font-semibold">{t('stay_payment_status')}</h3>
          {rails.map((rail) => (
            <div
              key={rail.key}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
            >
              <span>{rail.label}</span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right tabular-nums">
                <span
                  className={
                    (rail.paid?.val ?? 0) > 0
                      ? 'font-medium text-green-700'
                      : 'text-muted-foreground'
                  }
                >
                  {t(rail.verb, {
                    amount: amount(
                      rail.paid ?? {
                        val: 0,
                        cur:
                          rail.target?.cur ??
                          (rail.key === 'tokens' ? 'TDF' : currency),
                      },
                    ),
                  })}
                </span>
                {rail.target &&
                  hasSettlement &&
                  (rail.due > rail.epsilon ? (
                    <span className="rounded bg-pending/10 px-1.5 py-0.5 font-medium text-foreground">
                      {t(
                        rail.key === 'tokens'
                          ? 'stay_payment_still_to_stake'
                          : rail.key === 'credits'
                            ? 'stay_payment_still_to_redeem'
                            : 'stay_payment_due_amount',
                        {
                          amount: amount({
                            val: rail.due,
                            cur: rail.target.cur,
                          }),
                        },
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <Check size={14} aria-hidden="true" />
                      {t('stay_payment_complete')}
                    </span>
                  ))}
                {rail.key === 'tokens' && tokenActions}
              </div>
            </div>
          ))}
          {tokenActions && !rails.some((rail) => rail.key === 'tokens') && (
            <div className="flex justify-end">{tokenActions}</div>
          )}
          {!!stay.paymentDelta?.fiat && refundDue > FIAT_EPSILON && (
            <p className="text-xs text-muted-foreground">
              {t('stay_payment_refund_note')}
            </p>
          )}
        </section>
      )}

      {quote && (
        <section
          className="rounded-xl border border-foreground/10 p-3 space-y-2"
          aria-label={t('stay_payment_pending_change')}
        >
          <h3 className="font-semibold">{t('stay_payment_pending_change')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('stay_payment_pending_change_hint')}
          </p>
          <dl className="space-y-2">
            {quoteRows.map((row) => (
              <CostRow
                key={row.key}
                label={row.label}
                amount={amount({ val: Math.abs(row.val), cur: row.cur })}
              />
            ))}
          </dl>
          {(quote.tokensDelta ?? 0) > 0 && !awaitsHeldStake(stay) && (
            <p className="text-green-700">{t('stay_payment_change_staked')}</p>
          )}
        </section>
      )}

      <div
        className={`rounded-xl border p-4 space-y-2 ${isFullyPaid ? 'border-green-200 bg-green-50' : hasDue && !isAwaitingApproval ? 'border-pending/40 bg-pending/10' : 'border-transparent bg-foreground/[0.04]'}`}
        aria-live="polite"
      >
        {isAwaitingApproval ? (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground">
              <Clock size={18} aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              {awaitingApprovalNote ?? t('stay_payment_not_payable_yet')}
            </p>
          </div>
        ) : isFullyPaid ? (
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check size={18} aria-hidden="true" />
            </span>
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-green-800">
                {t('stay_payment_fully_paid')}
              </p>
              <p className="text-sm text-green-800/80">
                {t('stay_payment_nothing_remaining')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <dl className="text-base font-semibold">
              <CostRow
                label={t('stay_payment_page_amount_title')}
                amount={
                  <span className="flex flex-col gap-1 text-xl">
                    {dueAmounts.length
                      ? dueAmounts.map((value) => (
                          <span key={value.cur}>{amount(value)}</span>
                        ))
                      : hasSettlement
                        ? amount({ val: 0, cur: currency })
                        : '—'}
                  </span>
                }
              />
            </dl>
            {refundDue > FIAT_EPSILON && (
              <p>
                {t('stay_payment_refund_due', {
                  amount: amount({ val: refundDue, cur: currency }),
                })}
              </p>
            )}
            {!hasSettlement && (
              <p className="text-xs text-muted-foreground">
                {t('stay_payment_balance_unavailable')}
              </p>
            )}
          </>
        )}
      </div>
      {children}
    </div>
  );
}

export function StayPaymentHistory({
  charges,
  loading = false,
  error = false,
  onRetry,
  canManage = false,
}: {
  charges: Charge[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  canManage?: boolean;
}) {
  const t = useTranslations();
  const amount = usePaymentAmount();
  const { BLOCKCHAIN_EXPLORER_URL } = useConfig();
  const rows = [
    ...new Map(
      charges
        .filter((charge) =>
          ['paid', 'refunded', 'pending-refund'].includes(charge.status),
        )
        .map((charge) => [String(charge._id ?? charge.id), charge]),
    ).values(),
  ].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  const methodKeys: Record<string, string> = {
    stripe: 'stay_payment_method_card',
    tokens: 'stay_payment_method_tokens',
    credits: 'stay_payment_credits_label',
    crypto: 'stay_payment_method_crypto',
    monerium: 'stay_payment_method_bank',
    'bank-transfer': 'stay_payment_method_bank',
    cash: 'stay_payment_method_cash',
    manual: 'stay_payment_method_manual',
  };
  return (
    <section
      className="space-y-3 text-sm"
      aria-label={t('stay_payment_history')}
    >
      <BookingSurfaceDivider />
      <h3 className="font-semibold pt-1">{t('stay_payment_history')}</h3>
      {loading && (
        <p role="status" className="text-muted-foreground">
          {t('stay_payment_history_loading')}
        </p>
      )}
      {error && (
        <p role="alert" className="text-muted-foreground">
          {t('stay_payment_history_error')}
          {onRetry && (
            <button type="button" className="ml-2 underline" onClick={onRetry}>
              {t('stay_payment_history_retry')}
            </button>
          )}
        </p>
      )}
      {!loading && !error && !rows.length && (
        <p className="text-muted-foreground">
          {t('stay_payment_history_empty')}
        </p>
      )}
      <ul className="space-y-3">
        {rows.map((charge) => {
          const refunded = charge.status === 'refunded';
          // Older Charge documents store Money directly instead of { total: Money }.
          const storedAmount = charge.amount as Charge['amount'] | StayMoney;
          const total =
            'total' in storedAmount ? storedAmount.total : storedAmount;
          const paidAmount = refunded
            ? 'totalRefunded' in storedAmount
              ? (storedAmount.totalRefunded ?? total)
              : total
            : charge.method === 'tokens'
              ? (charge.lockedStake ?? total)
              : total;
          const stakeHashes =
            charge.method === 'tokens' &&
            charge.status === 'paid' &&
            BLOCKCHAIN_EXPLORER_URL
              ? [
                  ...new Set(
                    [
                      ...(charge.meta?.stakeTransactions || []).map(
                        (tx) => tx.transactionId,
                      ),
                      charge.meta?.txId,
                      charge.meta?.txHash,
                    ]
                      .filter((hash): hash is string =>
                        Boolean(hash && /^0x[0-9a-fA-F]{64}$/.test(hash)),
                      )
                      .map((hash) => hash.toLowerCase()),
                  ),
                ]
              : [];
          const explorerHref = (hash: string) =>
            `${BLOCKCHAIN_EXPLORER_URL.replace(/\/$/, '')}/tx/${hash}`;
          const stakeHref =
            stakeHashes.length === 1 ? explorerHref(stakeHashes[0]) : undefined;
          const href =
            stakeHref ||
            (canManage &&
            charge.method === 'stripe' &&
            charge.meta?.stripePaymentIntentId
              ? `https://dashboard.stripe.com/payments/${charge.meta.stripePaymentIntentId}`
              : undefined);
          return (
            <li
              key={String(charge._id ?? charge.id)}
              className="flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p>
                  {t(methodKeys[charge.method] ?? 'stay_payment_method_manual')}
                  {(refunded || charge.status === 'pending-refund') && (
                    <span className="ml-2 text-muted-foreground">
                      {t(
                        refunded
                          ? 'stay_payment_refunded'
                          : 'stay_payment_refund_pending',
                      )}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {charge.date && dayjs(charge.date).isValid() ? (
                    <time dateTime={dayjs(charge.date).toISOString()}>
                      {dayjs(charge.date).format('DD/MM/YYYY')}
                    </time>
                  ) : (
                    '—'
                  )}
                  {canManage &&
                    charge.meta?.reference &&
                    ` · ${charge.meta.reference}`}
                </p>
                {stakeHashes.length > 1 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                    {stakeHashes.map((hash) => (
                      <a
                        key={hash}
                        href={explorerHref(hash)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t('stay_payment_explorer_link', {
                          amount: hash,
                        })}
                        className="inline-flex items-center gap-1 underline hover:text-foreground"
                      >
                        {hash.slice(0, 8)}…{hash.slice(-6)}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <span className="shrink-0 tabular-nums font-medium">
                {href ? (
                  <a
                    href={href}
                    aria-label={
                      stakeHref
                        ? t('stay_payment_explorer_link', {
                            amount: amount(paidAmount),
                          })
                        : undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 underline"
                  >
                    {amount(paidAmount)}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : (
                  amount(paidAmount)
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {rows.some((charge) => charge.status === 'refunded') && (
        <p className="text-xs text-muted-foreground">
          {t('stay_payment_net_paid_note')}
        </p>
      )}
    </section>
  );
}
