import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

import AccountingEntityFootnote from '../../../components/AccountingEntityFootnote';
import BookingBackButton from '../../../components/BookingBackButton';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageError from '../../../components/PageError';
import {
  type PaymentMethodTab,
  PaymentMethodTabs,
} from '../../../components/PaymentMethodTabs';
import WalletPayButton, {
  WalletPayComplete,
} from '../../../components/WalletPayButton';
import {
  StayPaymentHistory,
  StayPaymentSummary,
} from '../../../components/booking/StayPaymentSummary';
import {
  StayStakeStatusCheck,
  canCheckStakeStatus,
} from '../../../components/booking/StayStakeStatusCheck';
import BookingSurface from '../../../components/booking/bookingSurface';
import BookingUnitsNote from '../../../components/booking/bookingUnitsNote';
import { StayCryptoPaymentSection } from '../../../components/booking/stayCryptoPaymentSection';
import StayPaymentFinalisingNotice from '../../../components/booking/stayPaymentFinalisingNotice';
import { StayPaymentTokenCreditControls } from '../../../components/booking/stayPaymentTokenCreditControls';
import { ErrorMessage, Information } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { useBookingLinkedCharges } from '../../../hooks/useBookingLinkedCharges';
import { useConfig } from '../../../hooks/useConfig';
import { useLivePaymentConfig } from '../../../hooks/useLivePaymentConfig';
import { useStayRouteId } from '../../../hooks/useStayRouteId';
import { BookingSettings, GeneralConfig } from '../../../types/api';
import { Charge, Listing } from '../../../types/booking';
import { TicketOption } from '../../../types/event';
import { Stay } from '../../../types/stay';
import { cdn } from '../../../utils/api';
import {
  getBlockchainNetworkName,
  getStablecoinSymbol,
} from '../../../utils/blockchainNetwork';
import { mergeBookingLedgerCharges } from '../../../utils/bookingChargesLedger.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { normalizeDiscountCode } from '../../../utils/discountCode';
import { fetchEvent } from '../../../utils/events';
import { fetchListing } from '../../../utils/listings';
import {
  canEditStayPreparation,
  getStayCheckoutPath,
} from '../../../utils/stayPaymentRouting.helpers';
import { checkoutStayWithStripe } from '../../../utils/stayStripeCheckout';
import {
  FIAT_EPSILON,
  awaitsHeldStake,
  canChangeStayPaymentMethod,
  canShowStayTokenCreditPaymentOptions,
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  formatStayMoney,
  getStay,
  hasLiveModificationPayment,
  stayUsesTokenAccommodation,
} from '../../../utils/stays.api';
import { chargeAccountFromCache } from '../../../utils/stripeAccounts';
import {
  createStripePromise,
  isCardPaymentReady,
} from '../../../utils/stripeConnect.helpers';
import PageNotFound from '../../not-found';

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  error?: string;
  messages?: any;
}

function StayPaymentInner({
  stay,
  listing,
  refetchStay,
  userEmail,
  userName,
  cardPaymentReady,
}: {
  stay: Stay;
  listing: Listing | null;
  refetchStay: (updated?: Stay) => Promise<Stay | null>;
  userEmail: string;
  userName: string;
  cardPaymentReady: boolean;
}) {
  const router = useRouter();
  const t = useTranslations();
  const { user } = useAuth();
  const isMember = Boolean(user?.roles?.includes('member'));
  const stripe = useStripe();
  const elements = useElements();

  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';
  const canPayWithCrypto = isWeb3BookingEnabled;
  const cryptoChain = getBlockchainNetworkName();
  const cryptoStablecoin = getStablecoinSymbol();

  const [actionError, setActionError] = useState<string | null>(null);
  const [fiatSwitchNotice, setFiatSwitchNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingStake, setIsCheckingStake] = useState(false);
  const [tokenBusy, setTokenBusy] = useState(false);
  const [cryptoBusy, setCryptoBusy] = useState(false);
  const [isFinalising, setIsFinalising] = useState(false);
  const [paymentTab, setPaymentTab] = useState<PaymentMethodTab>(
    cardPaymentReady ? 'card' : 'crypto',
  );

  useEffect(() => {
    if (!cardPaymentReady && isWeb3BookingEnabled) {
      setPaymentTab('crypto');
    }
  }, [cardPaymentReady, isWeb3BookingEnabled]);

  // Only needed to show what a saved event discount code took off the ticket.
  const [eventTicketOptions, setEventTicketOptions] = useState<
    TicketOption[] | null
  >(null);
  const discountedEventId =
    stay.eventId && normalizeDiscountCode(stay.eventDiscount)
      ? stay.eventId
      : null;
  useEffect(() => {
    setEventTicketOptions(null);
    if (!discountedEventId) return;
    let cancelled = false;
    fetchEvent(discountedEventId)
      .then((event) => {
        if (!cancelled) setEventTicketOptions(event?.ticketOptions ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [discountedEventId]);

  const destination = getStayCheckoutPath(stay);
  const redirectTarget =
    destination === `/stay/${stay._id}/payment` ? null : destination;
  const isSettlingChange = stay.pendingModification?.status === 'settling';
  const paymentInFlight = useRef(false);

  useEffect(() => {
    if (!redirectTarget || typeof window === 'undefined') return;
    router.replace(redirectTarget);
  }, [redirectTarget, router]);

  const fiatOwed = computeFiatOwed(stay);
  // The API refuses the card leg of a held change until its token stake is verified.
  const isCardWaitingOnStake = awaitsHeldStake(stay) && fiatOwed > FIAT_EPSILON;
  // A held change's credits are spent by the same settle the card payment triggers.
  const heldCreditsDue = hasLiveModificationPayment(stay)
    ? Math.max(0, Number(stay.pendingModification?.quote?.creditsDelta) || 0)
    : 0;
  const fiatCur =
    stay.pendingModification?.quote?.currency ||
    stay.priceLock?.total.cur ||
    stay.fiatTarget?.cur ||
    'EUR';
  const tokenCurrency =
    stay.tokensTarget?.cur || stay.appliedTokens?.cur || 'TDF';
  const amountLabel = formatStayMoney({
    val: fiatOwed,
    cur: fiatCur,
  });

  const {
    linkedCharges,
    refetchCharges,
    loading: chargesLoading,
    error: chargesError,
  } = useBookingLinkedCharges(stay._id, stay);
  const historyCharges = mergeBookingLedgerCharges(
    linkedCharges,
    (stay as Stay & { charges?: Charge[] }).charges,
  );
  const canManageBooking = Boolean(
    user?.roles?.some((role) => ['admin', 'space-host'].includes(role)),
  );
  const isOwnerOrHost = user?._id === stay.createdBy || canManageBooking;
  const showTokenControls =
    isOwnerOrHost &&
    !isSettlingChange &&
    ((canChangeStayPaymentMethod(stay) &&
      ((canShowStayTokenCreditPaymentOptions(stay, isMember) &&
        !(stay.tokensTarget?.val || stay.creditsTarget?.val)) ||
        stayUsesTokenAccommodation(stay))) ||
      (isWeb3BookingEnabled && computeTokensOwed(stay) > 0));

  const cover =
    listing?.photos && listing.photos.length > 0
      ? `${cdn}${listing.photos[0]}-post-md.jpg`
      : null;

  const handlePay = async () => {
    if (paymentInFlight.current || tokenBusy || cryptoBusy || isCheckingStake)
      return;
    paymentInFlight.current = true;
    setActionError(null);
    setIsProcessing(true);
    try {
      if (fiatOwed <= FIAT_EPSILON) {
        await checkoutWithPaymentMethod();
        return;
      }

      const card = elements?.getElement(CardElement) ?? null;
      if (!card) {
        setActionError(t('stay_create_card_required'));
        return;
      }

      if (!stripe) {
        setActionError(t('stay_create_stripe_not_ready'));
        return;
      }

      const { paymentMethod, error: pmError } =
        await stripe.createPaymentMethod({
          type: 'card',
          card,
          billing_details: { email: userEmail, name: userName },
        });
      if (pmError || !paymentMethod) {
        setActionError(pmError?.message || t('stay_create_card_error'));
        return;
      }

      await checkoutWithPaymentMethod(paymentMethod.id);
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
      paymentInFlight.current = false;
      setIsProcessing(false);
    }
  };

  /**
   * Pays for the stay with a payment method, whoever made it — the card field
   * or the wallet sheet above it. `onReadyFor3ds` lets the wallet close its
   * sheet before a challenge is raised, since the two cannot share the screen.
   */
  const checkoutWithPaymentMethod = async (
    paymentMethodId = '',
    onReadyFor3ds?: () => void,
  ): Promise<boolean> => {
    const outcome = await checkoutStayWithStripe({
      stayId: stay._id,
      paymentMethodId,
      stripe,
      onReadyFor3ds,
      change: hasLiveModificationPayment(stay)
        ? stay.pendingModification
        : null,
    });
    if (outcome.status === 'finalising') {
      setIsFinalising(true);
      return true;
    }
    if (outcome.status === 'stripe-not-ready') {
      setActionError(t('stay_create_stripe_not_ready'));
      return false;
    }
    if (outcome.status === 'failed') {
      setActionError(outcome.message || t('stay_create_payment_failed'));
      return false;
    }

    if (outcome.checkout?.needsTokenStake) {
      await refetchStay();
      return true;
    }

    const refreshed = await refetchStay();
    if (
      refreshed &&
      getStayCheckoutPath(refreshed) === `/stay/${refreshed._id}/confirmation`
    ) {
      router.replace(`/stay/${refreshed._id}/confirmation`);
    }
    return true;
  };

  const handleWalletPayment = async (
    paymentMethodId: string,
    complete: WalletPayComplete,
  ) => {
    if (paymentInFlight.current || tokenBusy || cryptoBusy || isCheckingStake) {
      complete('fail');
      return;
    }
    paymentInFlight.current = true;
    setActionError(null);
    setIsProcessing(true);
    try {
      const paid = await checkoutWithPaymentMethod(paymentMethodId, () =>
        complete('success'),
      );
      complete(paid ? 'success' : 'fail');
    } catch (err) {
      complete('fail');
      setActionError(parseMessageFromError(err));
    } finally {
      paymentInFlight.current = false;
      setIsProcessing(false);
    }
  };

  if (redirectTarget) {
    return (
      <main
        id="main-content"
        className="flex justify-center py-24"
        role="status"
        aria-label={t('stay_create_loading')}
      >
        <Spinner />
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="w-full max-w-screen-sm mx-auto p-4 md:p-6 pb-24 md:pb-12"
    >
      <div className="relative flex items-center min-h-[2.75rem] mb-4">
        <BookingBackButton
          onClick={() => router.push(`/stay/${stay._id}`)}
          name={t('buttons_back')}
          className="relative z-10"
        />
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
          <Heading
            level={1}
            className="text-2xl md:text-3xl pb-0 mt-0 text-center"
          >
            <span>{t('stay_payment_page_title')}</span>
          </Heading>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <BookingSurface
          tone="elevated"
          padding="md"
          as="section"
          aria-labelledby="stay-payment-summary-heading"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
            <Heading
              id="stay-payment-summary-heading"
              level={2}
              className="text-base mb-0 pb-0"
            >
              {t('stay_payment_page_summary_title')}
            </Heading>
            {isOwnerOrHost && canEditStayPreparation(stay) && !isFinalising && (
              <Link
                href={`/stay/create/${stay._id}?edit=true`}
                className="text-sm text-muted-foreground underline underline-offset-4 decoration-gray-300 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 rounded-sm"
              >
                {t('stay_payment_edit_details')}
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 flex-1 min-w-0">
              {cover && (
                <img
                  src={cover}
                  alt={
                    listing?.name
                      ? t('stay_create_listing_image_alt', {
                          name: listing.name,
                        })
                      : ''
                  }
                  loading="lazy"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="font-semibold text-gray-900 text-sm break-words leading-snug">
                  {listing?.name || t('stay_create_listing_unknown')}
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('stay_create_arrival')}
                    </dt>
                    <dd className="text-gray-900 mt-0.5 leading-snug">
                      <time dateTime={stay.start}>
                        {dayjs(stay.start).format('ddd, MMM D, YYYY')}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('stay_create_departure')}
                    </dt>
                    <dd className="text-gray-900 mt-0.5 leading-snug">
                      <time dateTime={stay.end}>
                        {dayjs(stay.end).format('ddd, MMM D, YYYY')}
                      </time>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('stay_create_guests_label')}
                    </dt>
                    <dd className="text-gray-900 mt-0.5 leading-snug">
                      {t('stay_payment_adults_count', { count: stay.adults })}
                      {(stay.children ?? 0) > 0 && (
                        <>
                          {' '}
                          ·{' '}
                          {t('stay_payment_children_count', {
                            count: stay.children,
                          })}
                        </>
                      )}
                      {(stay.infants ?? 0) > 0 && (
                        <>
                          {' '}
                          ·{' '}
                          {t('stay_payment_infants_count', {
                            count: stay.infants,
                          })}
                        </>
                      )}
                      {(stay.pets ?? 0) > 0 && (
                        <>
                          {' '}
                          · {t('stay_payment_pets_count', { count: stay.pets })}
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('stay_create_nights_label')}
                    </dt>
                    <dd className="text-gray-900 mt-0.5 leading-snug">
                      {t('bookings_dates_nights_selected', {
                        count: stay.duration || 0,
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <BookingUnitsNote
              numberOfUnits={stay.numberOfUnits}
              listingPrivate={listing?.private}
              adults={stay.adults}
              childCount={stay.children}
              className="text-xs text-muted-foreground"
            />
          </div>
        </BookingSurface>

        <BookingSurface tone="elevated" padding="md" className="space-y-5">
          <StayPaymentSummary
            stay={{
              ...stay,
              isHourlyBooking:
                listing?.priceDuration === 'hour' || stay.isHourlyBooking,
            }}
            eventTicketOptions={eventTicketOptions}
            tokenActions={
              canCheckStakeStatus(stay, user, isWeb3BookingEnabled) && (
                <StayStakeStatusCheck
                  stay={stay}
                  disabled={
                    isProcessing || isFinalising || tokenBusy || cryptoBusy
                  }
                  onBusyChange={setIsCheckingStake}
                  onChecked={refetchStay}
                />
              )
            }
          />
          <StayPaymentHistory
            charges={historyCharges}
            loading={chargesLoading}
            error={chargesError}
            onRetry={refetchCharges}
            canManage={canManageBooking}
          />
        </BookingSurface>

        <BookingSurface
          tone="elevated"
          padding="md"
          aria-labelledby="stay-payment-actions-heading"
          className="space-y-4"
        >
          <h2
            id="stay-payment-actions-heading"
            className="m-0 p-0 text-lg font-bold"
          >
            {t('stay_payment_actions_title')}
          </h2>
          {fiatSwitchNotice && (
            <div role="status">
              <Information>{fiatSwitchNotice}</Information>
            </div>
          )}
          {showTokenControls && (
            <section
              aria-labelledby="stay-token-credit-payment-heading"
              className="space-y-2"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3
                  id="stay-token-credit-payment-heading"
                  className="m-0 p-0 text-sm font-semibold"
                >
                  {computeTokensOwed(stay) > 0
                    ? t('stay_payment_complete_staking_title', {
                        currency: tokenCurrency,
                      })
                    : stayUsesTokenAccommodation(stay)
                      ? t('stay_payment_token_selected', {
                          currency: tokenCurrency,
                        })
                      : isWeb3BookingEnabled
                        ? t('stay_payment_tokens_credits_title', {
                            currency: tokenCurrency,
                          })
                        : t('stay_payment_use_credits')}
                </h3>
                {canChangeStayPaymentMethod(stay) &&
                  !stayUsesTokenAccommodation(stay) &&
                  computeTokensOwed(stay) === 0 && (
                    <span className="text-xs text-muted-foreground">
                      <span aria-hidden="true">· </span>
                      {t('stay_payment_optional')}
                    </span>
                  )}
              </div>
              <StayPaymentTokenCreditControls
                key={stay._id}
                disabled={
                  isCheckingStake || isProcessing || isFinalising || cryptoBusy
                }
                onBusyChange={setTokenBusy}
                stay={stay}
                onStaySynced={refetchStay}
                onFiatSwitchNotice={setFiatSwitchNotice}
                setBannerError={setActionError}
              />
            </section>
          )}

          <div role="alert" aria-live="assertive" className="empty:hidden">
            {actionError && <ErrorMessage error={actionError} />}
          </div>
          {isSettlingChange ? (
            <StayPaymentFinalisingNotice
              stayId={stay._id}
              onRefresh={refetchStay}
            />
          ) : (
            fiatOwed <= FIAT_EPSILON &&
            !isFinalising &&
            (computeCreditsOwed(stay) > 0 || computeTokensOwed(stay) === 0) && (
              <Button
                isEnabled={
                  !isProcessing && !isCheckingStake && !tokenBusy && !cryptoBusy
                }
                isLoading={isProcessing}
                onClick={() => void handlePay()}
              >
                {t('stay_payment_complete_button')}
              </Button>
            )
          )}
          {!isSettlingChange && (fiatOwed > FIAT_EPSILON || isFinalising) && (
            <section
              aria-labelledby="stay-money-payment-heading"
              className={`space-y-3${showTokenControls ? ' border-t border-foreground/10 pt-5' : ''}`}
            >
              <h3
                id="stay-money-payment-heading"
                className="m-0 p-0 text-sm font-semibold"
              >
                {t('stay_payment_remaining_title', {
                  currency: fiatCur,
                  amount: amountLabel,
                })}
              </h3>
              {canPayWithCrypto &&
              cardPaymentReady &&
              fiatOwed > FIAT_EPSILON ? (
                <PaymentMethodTabs
                  active={paymentTab}
                  onChange={setPaymentTab}
                  isEnabled={
                    !isProcessing &&
                    !isFinalising &&
                    !tokenBusy &&
                    !cryptoBusy &&
                    !isCheckingStake
                  }
                />
              ) : null}
              {cardPaymentReady ? (
                <div
                  hidden={canPayWithCrypto && paymentTab === 'crypto'}
                  className="space-y-3"
                >
                  <WalletPayButton
                    amount={fiatOwed}
                    currency={fiatCur}
                    label={listing?.name || t('stay_create_card_title')}
                    payerEmail={userEmail}
                    isEnabled={
                      !isCheckingStake &&
                      !isProcessing &&
                      !isFinalising &&
                      !tokenBusy &&
                      !cryptoBusy &&
                      !isCardWaitingOnStake
                    }
                    onPaymentMethod={handleWalletPayment}
                    onError={setActionError}
                  />
                  <div className="rounded-xl border border-gray-200 px-4 py-3.5 bg-white">
                    <CardElement
                      options={{
                        hidePostalCode: true,
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#111827',
                            fontFamily: 'inherit',
                            '::placeholder': { color: '#9ca3af' },
                          },
                          invalid: { color: '#9f1f42' },
                        },
                      }}
                    />
                  </div>
                </div>
              ) : null}
              {canPayWithCrypto && paymentTab === 'crypto' ? (
                <p className="text-xs text-muted-foreground">
                  {t('stay_payment_crypto_hint', {
                    token: cryptoStablecoin,
                    chain: cryptoChain,
                  })}
                </p>
              ) : null}

              {heldCreditsDue > 0 && (
                <Information className="text-sm">
                  {t('stay_payment_page_held_credits', {
                    credits: heldCreditsDue,
                  })}
                </Information>
              )}
              {isCardWaitingOnStake && (
                <Information className="text-sm">
                  {t('stay_payment_page_stake_first')}
                </Information>
              )}

              <div className="flex flex-col gap-3">
                {isFinalising ? (
                  <StayPaymentFinalisingNotice
                    stayId={stay._id}
                    onRefresh={refetchStay}
                  />
                ) : fiatOwed > FIAT_EPSILON ? (
                  canPayWithCrypto && paymentTab === 'crypto' ? (
                    <StayCryptoPaymentSection
                      onBusyChange={setCryptoBusy}
                      stay={stay}
                      onStayUpdated={() => void refetchStay()}
                      isEnabled={
                        !isCheckingStake && !isProcessing && !tokenBusy
                      }
                      buttonVariant="primary"
                    />
                  ) : cardPaymentReady ? (
                    <Button
                      isEnabled={
                        !isCheckingStake &&
                        !tokenBusy &&
                        !cryptoBusy &&
                        !isProcessing &&
                        !isCardWaitingOnStake
                      }
                      isLoading={isProcessing}
                      onClick={() => void handlePay()}
                      className="min-h-[48px]"
                    >
                      {t('stay_payment_pay_amount', { amount: amountLabel })}
                    </Button>
                  ) : null
                ) : null}
              </div>
              <div className="space-y-1">
                {cardPaymentReady && paymentTab === 'card' && (
                  <p className="text-xs text-muted-foreground">
                    {t('stay_create_card_disclaimer')}
                  </p>
                )}
                <AccountingEntityFootnote productSlug="accommodations" />
              </div>
            </section>
          )}
        </BookingSurface>
      </div>
    </main>
  );
}

const StayPaymentPage = ({ bookingSettings, generalConfig, error }: Props) => {
  const router = useRouter();
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const { stayId, isNotFound, isResolving } = useStayRouteId();

  const isBookingEnabled =
    !!bookingSettings && process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [stay, setStay] = useState<Stay | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const paymentConfig = useLivePaymentConfig();
  const routed = chargeAccountFromCache(paymentConfig, 'accommodations');
  const cardPaymentReady = isCardPaymentReady(paymentConfig, routed.accountId);
  const stripePromise = useMemo(
    () => createStripePromise(paymentConfig, routed.accountId),
    [paymentConfig, routed.accountId],
  );

  const stayRequest = useRef(0);
  const refetchStay = useCallback(
    async (updated?: Stay) => {
      if (!stayId) return null;
      const request = ++stayRequest.current;
      // The mutation response is already reconciled. Do not let an older GET
      // overwrite it while supplementary data is refreshing.
      if (updated?._id === stayId) {
        setStay((previous) => ({ ...previous, ...updated }));
        return updated;
      }
      const next = await getStay(stayId);
      if (request === stayRequest.current) setStay(next);
      return next;
    },
    [stayId],
  );

  useEffect(() => {
    if (!router.isReady) return;
    if (!stayId) {
      setStay(null);
      setListing(null);
      setPageError(null);
      setIsLoading(true);
      return;
    }
    let cancelled = false;
    const request = ++stayRequest.current;
    (async () => {
      setIsLoading(true);
      setPageError(null);
      try {
        const next = await getStay(stayId);
        if (cancelled) return;
        if (request === stayRequest.current) setStay(next);
        if (next.listing) {
          try {
            const nextListing = await fetchListing(next.listing);
            if (!cancelled) setListing(nextListing ?? null);
          } catch (err) {
            console.warn('Could not load listing', err);
          }
        }
      } catch (err) {
        if (!cancelled) setPageError(parseMessageFromError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      ++stayRequest.current;
    };
  }, [router.isReady, stayId]);

  if (error) return <PageError error={error} />;
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;
  if (isNotFound) return <PageNotFound />;

  const pageTitle = `${t('stay_payment_page_meta_title')} - ${PLATFORM_NAME}`;

  const SeoHead = (
    <Head>
      <title>{pageTitle}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta
        name="description"
        content={t('stay_payment_page_meta_description')}
      />
    </Head>
  );

  if (isResolving || (isAuthenticated && isLoading)) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="flex justify-center py-24"
          role="status"
          aria-label={t('stay_create_loading')}
        >
          <Spinner />
        </main>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6 text-center"
        >
          <Heading level={1} className="text-2xl md:text-3xl">
            {t('stay_create_login_required_title')}
          </Heading>
          <p className="mt-3 text-muted-foreground">
            {t('stay_create_login_required_description')}
          </p>
          <Button
            className="mt-6 min-h-[44px]"
            isFullWidth={false}
            onClick={() => router.push('/login')}
          >
            {t('login_title')}
          </Button>
        </main>
      </>
    );
  }

  if (pageError || !stay) {
    return (
      <>
        {SeoHead}
        <main className="w-full max-w-screen-sm mx-auto p-4 md:p-6">
          <ErrorMessage error={pageError || t('stay_create_not_found')} />
          <Button
            className="mt-4 min-h-[44px]"
            isFullWidth={false}
            onClick={() => router.push('/stay')}
          >
            {t('stay_create_back_to_search')}
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      {SeoHead}
      <Elements key={routed.accountId || 'default'} stripe={stripePromise}>
        <StayPaymentInner
          stay={stay}
          listing={listing}
          refetchStay={refetchStay}
          userEmail={user?.email || ''}
          userName={user?.screenname || ''}
          cardPaymentReady={cardPaymentReady}
        />
      </Elements>
    </>
  );
};

StayPaymentPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;
    return { bookingSettings, generalConfig };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      generalConfig: null,
    };
  }
};

export default StayPaymentPage;
