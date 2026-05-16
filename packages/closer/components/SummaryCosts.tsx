import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { ExternalLink } from 'lucide-react';

import dayjs from 'dayjs';

import { useConfig } from '../hooks/useConfig';
import { IconBanknote } from './BookingIcons';
import { Charge } from '../types/booking';
import { CloserCurrencies, Price } from '../types';
import {
  getBookingPaymentType,
  getDisplayTotalFromComponents,
} from '../utils/booking.helpers';
import { formatBookingLedgerChargeDisplay } from '../utils/bookingChargesLedger.helpers';
import { getVatInfo, priceFormat } from '../utils/helpers';
import DisplayPrice from './DisplayPrice';
import BookingUnitsNote from './booking/bookingUnitsNote';
import { Button } from './ui';
import HeadingRow from './ui/HeadingRow';

interface Props {
  rentalFiat?: Price<CloserCurrencies>;
  rentalToken?: Price<CloserCurrencies>;
  utilityFiat?: Price<CloserCurrencies>;
  foodFiat?: Price<CloserCurrencies>;
  accomodationCost?: Price<CloserCurrencies>;
  useTokens: boolean;
  useCredits: boolean;
  totalToken: Price<CloserCurrencies>;
  totalFiat: Price<CloserCurrencies>;
  eventCost?: Price<CloserCurrencies>;
  eventDefaultCost?: number;
  accomodationDefaultCost?: number;
  volunteerId?: string;
  isNotPaid?: boolean;
  updatedAccomodationTotal?: Price<CloserCurrencies>;
  isEditMode?: boolean;
  updatedUtilityTotal?: Price<CloserCurrencies>;
  updatedFoodTotal?: Price<CloserCurrencies>;
  updatedFiatTotal?: Price<CloserCurrencies>;
  updatedEventTotal?: Price<CloserCurrencies>;
  priceDuration?: string;
  vatRate?: number;
  isFoodIncluded: boolean;
  creditsPrice?: number;
  updatedRentalFiat?: Price<CloserCurrencies>;
  updatedRentalToken?: Price<CloserCurrencies>;
  status?: string;
  foodOptionEnabled?: boolean;
  utilityOptionEnabled?: boolean;
  hideTitle?: boolean;
  charges?: Charge[];
  paymentDelta?: {
    fiat: { val: number; cur: CloserCurrencies };
    token?: { val: number; cur: CloserCurrencies };
    credits?: { val: number; cur: 'credits' };
  } | null;
  guestCostsLedger?: boolean;
  compact?: boolean;
  pricingPreviewAvailable?: boolean;
  onBookingCheckout?: () => void | Promise<void>;
  bookingCheckoutLoading?: boolean;
  numberOfUnits?: number | null;
  listingPrivate?: boolean;
  bookingAdults?: number | null;
  bookingChildren?: number | null;
}

const SummaryCosts = ({
  rentalFiat,
  rentalToken,
  utilityFiat,
  foodFiat,
  accomodationCost,
  useTokens,
  useCredits,
  totalToken,
  totalFiat,
  eventCost,
  eventDefaultCost,
  isNotPaid,
  updatedAccomodationTotal,
  isEditMode,
  updatedUtilityTotal,
  updatedFoodTotal,
  updatedFiatTotal,
  updatedEventTotal,
  priceDuration,
  vatRate,
  isFoodIncluded,
  creditsPrice,
  updatedRentalFiat,
  updatedRentalToken,
  status,
  foodOptionEnabled,
  utilityOptionEnabled,
  hideTitle,
  charges,
  paymentDelta,
  guestCostsLedger,
  compact = false,
  pricingPreviewAvailable = false,
  onBookingCheckout,
  bookingCheckoutLoading = false,
  numberOfUnits,
  listingPrivate,
  bookingAdults,
  bookingChildren,
}: Props) => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();
  const cr = compact ? 'mt-1.5' : 'mt-3';
  const descCls = compact ? 'mt-0.5 text-right text-[11px] leading-snug' : 'text-right text-xs';
  const rowText = compact ? 'text-sm' : '';

  const paymentType = getBookingPaymentType({
    useCredits,
    useTokens,
    rentalFiat,
  });

  const calculatedTotalFiat = getDisplayTotalFromComponents({
    rentalFiat,
    utilityFiat,
    foodFiat,
    eventFiat: eventCost,
    fallbackCur: totalFiat?.cur ?? CloserCurrencies.EUR,
    foodOptionEnabled,
    utilityOptionEnabled,
  });

  const displayTotalFiat =
    totalFiat?.val != null && totalFiat?.cur
      ? totalFiat
      : calculatedTotalFiat;

  const fiatLedgerCurrency =
    displayTotalFiat?.cur ??
    totalFiat?.cur ??
    rentalFiat?.cur ??
    CloserCurrencies.EUR;

  const ledgerCharges = charges ?? [];

  const settledDisplayCharges = [...ledgerCharges]
    .filter((c) => c.status === 'paid' || c.status === 'refunded')
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

  const pendingLedgerCharges = ledgerCharges.filter(
    (c) => c.status === 'pending-payment',
  );

  const hasPaymentMovement =
    Boolean(paymentDelta?.fiat && Math.abs(paymentDelta.fiat.val) > 0.005) ||
    Boolean(
      useTokens &&
        paymentDelta?.token &&
        Math.abs(paymentDelta.token.val) > 0.005,
    ) ||
    Boolean(
      paymentDelta?.credits &&
        Math.abs(paymentDelta.credits.val) > 0.005,
    );

  const showIntegratedFooter =
    Boolean(guestCostsLedger && !isEditMode) ||
    ledgerCharges.length > 0 ||
    hasPaymentMovement ||
    pendingLedgerCharges.length > 0 ||
    Boolean(isEditMode && pricingPreviewAvailable);

  const fiatDelta = paymentDelta?.fiat;
  const hasFiatRefundDue = Boolean(fiatDelta && fiatDelta.val < -0.005);

  const positiveFiatFromDelta =
    fiatDelta && fiatDelta.val > 0.005 ? fiatDelta : null;
  const tokenDueFromDelta =
    paymentDelta?.token && paymentDelta.token.val > 0.005
      ? paymentDelta.token
      : null;
  const creditsDueFromDelta =
    paymentDelta?.credits && paymentDelta.credits.val > 0.005
      ? paymentDelta.credits
      : null;

  const amountDueSummaryParts: string[] = [];
  if (positiveFiatFromDelta) {
    amountDueSummaryParts.push(
      priceFormat(positiveFiatFromDelta.val, positiveFiatFromDelta.cur),
    );
  }
  if (tokenDueFromDelta) {
    amountDueSummaryParts.push(
      priceFormat(tokenDueFromDelta.val, tokenDueFromDelta.cur),
    );
  }
  if (creditsDueFromDelta) {
    amountDueSummaryParts.push(
      priceFormat({
        val: creditsDueFromDelta.val,
        cur: 'credits',
        app: APP_NAME,
      }),
    );
  }
  const hasPositivePaymentDeltaDue = amountDueSummaryParts.length > 0;

  const showSubtotalUpdatedChip =
    Boolean(isEditMode && pricingPreviewAvailable) &&
    !useTokens &&
    !useCredits &&
    updatedFiatTotal != null &&
    totalFiat?.val != null &&
    Math.abs((updatedFiatTotal.val ?? 0) - (totalFiat.val ?? 0)) > 0.005 &&
    status !== 'cancelled';

  const showDueRows = pendingLedgerCharges.length > 0;

  const hideLineUnpaidBadge = showIntegratedFooter;

  const accommodationEditDirty =
    updatedRentalFiat?.val !== rentalFiat?.val ||
    (useTokens &&
      updatedRentalToken != null &&
      rentalToken != null &&
      updatedRentalToken.val.toFixed(2) !== rentalToken.val.toFixed(2));

  const renderBookingAmountSummary = ({
    emphasize,
    showUnpaidTag,
  }: {
    emphasize: boolean;
    showUnpaidTag: boolean;
  }) => {
    const unpaid =
      showUnpaidTag && isNotPaid ? (
        <span className="text-failure"> {t('booking_card_unpaid')}</span>
      ) : null;
    const cls = emphasize ? 'font-bold text-lg' : 'font-bold';

    if (priceDuration === 'hour') {
      return (
        <div className={cls}>
          {useTokens && (
            <span>
              {priceFormat(
                totalToken ?? {
                  val: 0,
                  cur: CloserCurrencies.TDF,
                },
              )}
            </span>
          )}
          {useCredits && (
            <span>
              {priceFormat({
                val: totalToken?.val ?? 0,
                cur: 'credits',
                app: APP_NAME,
              })}
            </span>
          )}
          {!useTokens && !useCredits && (
            <>
              {priceFormat(displayTotalFiat)}
              {unpaid}
            </>
          )}
        </div>
      );
    }

    return (
      <div className={cls}>
        {useTokens && (
          <>
            <span>
              {priceFormat(
                totalToken ?? {
                  val: 0,
                  cur: CloserCurrencies.TDF,
                },
              )}
            </span>
            {displayTotalFiat.val > 0 && (
              <>
                {' '}
                + <span>{priceFormat(displayTotalFiat)}</span>
              </>
            )}
            {unpaid}
          </>
        )}
        {useCredits && (
          <>
            <span>
              {priceFormat({
                val: creditsPrice || totalToken?.val,
                cur: 'credits',
                app: APP_NAME,
              })}
            </span>{' '}
            + <span>{priceFormat(displayTotalFiat)}</span>
            {unpaid}
          </>
        )}
        {!useTokens && !useCredits && (
          <div>
            {priceFormat(displayTotalFiat)}
            {unpaid}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {!hideTitle && (
        <HeadingRow>
          <IconBanknote className="mr-4" />
          <span>{t('bookings_summary_step_costs_title')}</span>
        </HeadingRow>
      )}

      {eventCost ? (
        <div className={`flex justify-between items-center ${cr} ${rowText}`}>
          <p>{t('bookings_checkout_event_cost')}</p>
          <div className="flex items-center gap-2">
            {isEditMode &&
              pricingPreviewAvailable &&
              updatedEventTotal?.val !== eventCost?.val &&
              status !== 'cancelled' && (
                <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                  {t('bookings_updated_price')}:{' '}
                  {priceFormat(updatedEventTotal)}
                </div>
              )}
            <p className="font-bold">
              {eventCost?.val !== 0 && eventDefaultCost !== eventCost?.val && (
                <span className="line-through">
                  {priceFormat(eventDefaultCost)}
                </span>
              )}{' '}
              {priceFormat(eventCost)}
              {isNotPaid && !hideLineUnpaidBadge && (
                <span className="text-failure">
                  {' '}
                  {t('booking_card_unpaid')}
                </span>
              )}
            </p>
          </div>
        </div>
      ) : null}

      {(priceDuration === 'night' || !priceDuration) && (
        <>
          <div className={`flex justify-between items-center ${cr} ${rowText}`}>
            <p>{t('bookings_summary_step_dates_accomodation_type')}</p>

            <div className="flex items-center gap-2">
              {isEditMode &&
                pricingPreviewAvailable &&
                accommodationEditDirty &&
                status !== 'cancelled' && (
                  <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                    {t('bookings_updated_price')}:{' '}
                    <DisplayPrice
                      paymentType={paymentType}
                      isEditMode={true}
                      rentalFiat={updatedRentalFiat}
                      rentalToken={updatedRentalToken}
                      totalFiat={updatedFiatTotal}
                      isAccommodationPrice={true}
                    />
                  </div>
                )}

              <div className="font-bold">
                <DisplayPrice
                  paymentType={paymentType}
                  isEditMode={false}
                  rentalFiat={rentalFiat}
                  rentalToken={rentalToken}
                  isAccommodationPrice={true}
                />

                {isNotPaid && !hideLineUnpaidBadge && (
                  <span className="text-failure">
                    {' '}
                    {t('booking_card_unpaid')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className={descCls}>
            {t('bookings_summary_step_accomodation_type_description')}
          </p>

          {utilityOptionEnabled ? (
            <div>
              <div className={`flex justify-between items-center ${cr} ${rowText}`}>
                <p> {t('bookings_summary_step_utility_total')}</p>
                <div className="flex items-center gap-2">
                  {isEditMode &&
                    pricingPreviewAvailable &&
                    status !== 'cancelled' &&
                    updatedUtilityTotal?.val !== utilityFiat?.val && (
                      <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                        {t('bookings_updated_price')}:{' '}
                        {priceFormat(updatedUtilityTotal)}
                      </div>
                    )}

                  <p className="font-bold">
                    {priceFormat(
                      utilityFiat ?? {
                        val: 0,
                        cur: totalFiat?.cur ?? CloserCurrencies.EUR,
                      },
                    )}
                    {isNotPaid && !hideLineUnpaidBadge && (
                      <span className="text-failure">
                        {' '}
                        {t('booking_card_unpaid')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className={descCls}>
                {t('bookings_summary_step_utility_description')}
              </p>
            </div>
          ) : null}

          {foodOptionEnabled ? (
            <div>
              <div className={`flex justify-between items-center ${cr} ${rowText}`}>
                <p> {t('bookings_summary_step_food_total')}</p>
                <div className="flex items-center gap-2">
                  {isEditMode &&
                    pricingPreviewAvailable &&
                    updatedFoodTotal?.val !== foodFiat?.val &&
                    status !== 'cancelled' && (
                      <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                        {t('bookings_updated_price')}:{' '}
                        {priceFormat(updatedFoodTotal)}
                      </div>
                    )}
                  <p className="font-bold">
                    {isFoodIncluded
                      ? priceFormat(
                          foodFiat ?? {
                            val: 0,
                            cur: totalFiat?.cur ?? CloserCurrencies.EUR,
                          },
                        )
                      : t('stay_food_not_included')}
                    {isNotPaid && !hideLineUnpaidBadge && (
                      <span className="text-failure">
                        {' '}
                        {t('booking_card_unpaid')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className={descCls}>
                {t('bookings_summary_step_utility_description')}
              </p>
            </div>
          ) : null}
          <BookingUnitsNote
            numberOfUnits={numberOfUnits}
            listingPrivate={listingPrivate}
            adults={bookingAdults}
            children={bookingChildren}
            className={
              compact
                ? `${descCls} mt-1`
                : 'text-right text-xs text-gray-600 mt-3'
            }
          />
        </>
      )}

      {showIntegratedFooter ? (
        <div
          className={`rounded-lg bg-accent-light/10 ${
            compact
              ? 'mt-3 flex flex-col gap-2 px-2 py-3 pt-2'
              : 'mt-4 flex flex-col gap-4 px-3 py-4 pt-3'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
            <p
              className={
                compact ? 'text-base font-semibold' : 'text-lg font-semibold'
              }
            >
              {t('bookings_costs_subtotal')}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {showSubtotalUpdatedChip && updatedFiatTotal ? (
                <div
                  className={`rounded-md bg-accent-light px-2 py-1 font-bold ${
                    compact ? 'text-xs' : 'text-sm'
                  }`}
                >
                  {t('bookings_updated_price')}:{' '}
                  {priceFormat(updatedFiatTotal.val, updatedFiatTotal.cur)}
                </div>
              ) : null}
              <div
                className={compact ? 'font-bold text-base' : 'font-bold text-lg'}
              >
                {renderBookingAmountSummary({
                  emphasize: !compact,
                  showUnpaidTag: false,
                })}
              </div>
            </div>
          </div>
          <p
            className={`text-right ${compact ? 'text-[11px] leading-snug' : 'text-xs'} mt-1 text-disabled`}
          >
            {t('bookings_checkout_step_total_description')}{' '}
            {getVatInfo(displayTotalFiat, vatRate)}
          </p>
          {settledDisplayCharges.length > 0 && (
            <div className="flex flex-col gap-1 pt-2">
              <p
                className={
                  compact
                    ? 'text-[11px] font-semibold uppercase tracking-wide text-disabled'
                    : 'text-sm font-semibold text-foreground'
                }
              >
                {t('bookings_costs_paid_heading')}
              </p>
              {settledDisplayCharges.map((charge, idx) => {
                const paidAmount = formatBookingLedgerChargeDisplay(charge);
                const stripeHref =
                  charge.method === 'stripe' &&
                  charge.meta?.stripePaymentIntentId
                    ? `https://dashboard.stripe.com/payments/${charge.meta.stripePaymentIntentId}`
                    : null;

                return (
                  <div
                    key={String(charge.id ?? charge._id ?? idx)}
                    className={`flex justify-between items-center gap-2 ${cr} ${rowText}`}
                  >
                    <p className="min-w-0 flex-1 leading-snug">
                      <span className="text-disabled">
                        {dayjs(charge.date).format('DD/MM/YYYY')}
                      </span>
                      <span className="text-disabled"> · </span>
                      <span className="capitalize">{charge.method}</span>
                      <span className="text-disabled"> · </span>
                      <span className="capitalize text-disabled">
                        {charge.status}
                      </span>
                    </p>
                    <div className="shrink-0 font-bold tabular-nums">
                      {stripeHref ? (
                        <Link
                          href={stripeHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent no-underline hover:underline"
                        >
                          {paidAmount}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      ) : (
                        paidAmount
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {hasFiatRefundDue && fiatDelta && (
            <div className="pt-3">
              <p className="text-sm font-semibold text-success">
                {t('bookings_amount_to_refund')}{' '}
                {priceFormat(Math.abs(fiatDelta.val), fiatDelta.cur)}
              </p>
            </div>
          )}
          {showDueRows ? (
            <div
              className={`flex flex-col ${compact ? 'gap-1.5 pt-2' : 'gap-2 pt-3'}`}
            >
              {pendingLedgerCharges.map((charge, idx) => (
                <div
                  key={`pending-${charge.id ?? charge._id ?? idx}`}
                  className={`flex justify-between items-center gap-2 ${cr} ${rowText}`}
                >
                  <p>{t('bookings_costs_due_label')}</p>
                  <p className="text-right font-bold">
                    <span className="tabular-nums">
                      {formatBookingLedgerChargeDisplay(charge)}
                    </span>
                    <span className="font-normal text-failure">
                      {' '}
                      {t('bookings_costs_pending_suffix')}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 pt-3">
            <p
              className={
                compact ? 'text-base font-semibold' : 'text-lg font-semibold'
              }
            >
              {hasFiatRefundDue
                ? t('bookings_costs_balance_due')
                : t('bookings_amount_due')}
            </p>
            <p
              className={`font-bold text-right ${compact ? 'text-base' : 'text-lg'}`}
            >
              {hasPositivePaymentDeltaDue
                ? amountDueSummaryParts.join(' + ')
                : hasFiatRefundDue && paymentDelta?.fiat
                  ? priceFormat(
                      paymentDelta.fiat.val,
                      paymentDelta.fiat.cur,
                    )
                  : priceFormat(0, fiatLedgerCurrency)}
            </p>
          </div>
          {hasPositivePaymentDeltaDue && onBookingCheckout ? (
            <div className="flex justify-end pt-2">
              <Button
                variant="inline"
                size="small"
                isFullWidth={false}
                isLoading={bookingCheckoutLoading}
                className="rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wide"
                onClick={() => void onBookingCheckout()}
              >
                {t('booking_pay_now')}
              </Button>
            </div>
          ) : null}
          {useTokens && displayTotalFiat.val > 0 && (
            <p className="pt-2 text-xs text-foreground">
              {t('bookings_summary_hybrid_payment_note')}
            </p>
          )}
        </div>
      ) : (
        <div
          className={`rounded-lg bg-accent-light/10 ${
            compact ? 'mt-3 px-2 py-2 pt-2' : 'mt-4 px-3 py-3 pt-3'
          }`}
        >
        <div className="flex justify-between items-center">
          <p className="font-semibold text-lg">{t('bookings_total')}</p>
        <div className="flex items-center gap-2">
          {isEditMode &&
            pricingPreviewAvailable &&
            status !== 'cancelled' &&
            (updatedFiatTotal?.val !== totalFiat?.val ||
              updatedAccomodationTotal?.val !== accomodationCost?.val) && (
              <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                {t('bookings_updated_price')}:{' '}
                {priceDuration === 'night' && (
                  <div>
                    <DisplayPrice
                      paymentType={paymentType}
                      isEditMode={true}
                      rentalFiat={updatedRentalFiat}
                      rentalToken={updatedRentalToken}
                      totalFiat={updatedFiatTotal}
                      isTotalPrice={true}
                    />
                  </div>
                )}
                {priceDuration === 'hour' && (
                  <div>
                    {useTokens && (
                      <div>{priceFormat(updatedAccomodationTotal)}</div>
                    )}

                    {useCredits && (
                      <div>
                        {priceFormat({
                          val: updatedAccomodationTotal?.val,
                          cur: 'credits',
                          app: APP_NAME,
                        })}
                      </div>
                    )}
                    {!useTokens && !useCredits && priceFormat(updatedFiatTotal)}
                  </div>
                )}
              </div>
            )}

          {(priceDuration === 'night' || !priceDuration) && (
            <div className="font-bold text-lg">
              {useTokens && (
                <>
                  <span>
                    {priceFormat(
                      totalToken ?? {
                        val: 0,
                        cur: CloserCurrencies.TDF,
                      },
                    )}
                  </span>
                  {displayTotalFiat.val > 0 && (
                    <>
                      {' '}
                      + <span>{priceFormat(displayTotalFiat)}</span>
                    </>
                  )}
                  {isNotPaid && (
                    <span className="text-failure">
                      {' '}
                      {t('booking_card_unpaid')}
                    </span>
                  )}
                </>
              )}
              {useCredits && (
                <>
                  <span>
                    {priceFormat({
                      val: creditsPrice || totalToken?.val,
                      cur: 'credits',
                      app: APP_NAME,
                    })}
                  </span>{' '}
                  + <span>{priceFormat(displayTotalFiat)}</span>
                  {isNotPaid && (
                    <span className="text-failure">
                      {' '}
                      {t('booking_card_unpaid')}
                    </span>
                  )}
                </>
              )}

              {!useTokens && !useCredits && (
                <div>
                  {' '}
                  {priceFormat(displayTotalFiat)}
                  {isNotPaid && (
                    <span className="text-failure">
                      {' '}
                      {t('booking_card_unpaid')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {priceDuration === 'hour' && (
            <div className="font-bold">
              {useTokens && (
                <>
                  <span>
                    {priceFormat(
                      totalToken ?? {
                        val: 0,
                        cur: CloserCurrencies.TDF,
                      },
                    )}
                  </span>
                </>
              )}
              {useCredits && (
                <>
                  <span>
                    {priceFormat({
                      val: totalToken.val,
                      cur: 'credits',
                      app: APP_NAME,
                    })}
                  </span>
                </>
              )}

              {!useTokens && !useCredits && (
                <div>
                  {' '}
                  {priceFormat(displayTotalFiat)}
                  {isNotPaid && (
                    <span className="text-failure">
                      {' '}
                      {t('booking_card_unpaid')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
        <p className="text-right text-xs mt-2">
          {t('bookings_checkout_step_total_description')}{' '}
          {getVatInfo(displayTotalFiat, vatRate)}
        </p>
        {useTokens && displayTotalFiat.val > 0 && (
          <p className="mt-2 pt-2 text-xs text-foreground">
            {t('bookings_summary_hybrid_payment_note')}
          </p>
        )}
      </div>
      )}
    </div>
  );
};

export default SummaryCosts;
