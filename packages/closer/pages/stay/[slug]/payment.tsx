import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import dayjs from 'dayjs';
import { loadStripe } from '@stripe/stripe-js';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingSurface from '../../../components/booking/bookingSurface';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageError from '../../../components/PageError';
import { ErrorMessage } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { BookingSettings, GeneralConfig } from '../../../types/api';
import { Listing } from '../../../types/booking';
import { Stay, StayCheckoutResponse } from '../../../types/stay';
import api, { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { stayRequiresFullCheckoutFlow } from '../../../utils/stayPaymentRouting.helpers';
import {
  checkoutStay,
  computeFiatOwed,
  confirmStayCheckout,
  getStay,
  isStayAwaitingPayment,
  isStayPaid,
  isStayTerminal,
  formatStayMoney,
} from '../../../utils/stays.api';

const stripePromise = process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY, {
      stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
    })
  : null;

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
}: {
  stay: Stay;
  listing: Listing | null;
  refetchStay: () => Promise<Stay | null>;
  userEmail: string;
  userName: string;
}) {
  const router = useRouter();
  const t = useTranslations();
  const stripe = useStripe();
  const elements = useElements();

  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const redirectTarget = useMemo(() => {
    if (isStayPaid(stay)) return `/stay/${stay._id}/confirmation` as const;
    if (isStayTerminal(stay)) return `/stay/${stay._id}` as const;
    if (stay.status === 'pending') return `/stay/${stay._id}/pending` as const;
    if (stay.status === 'draft') return `/stay/create/${stay._id}` as const;
    if (
      stayRequiresFullCheckoutFlow(stay, stay.paymentDelta)
    ) {
      return `/stay/create/${stay._id}` as const;
    }
    if (!['confirmed', 'pending-payment'].includes(stay.status)) {
      return `/stay/create/${stay._id}` as const;
    }
    const fiatOwed = computeFiatOwed(stay);
    if (fiatOwed <= 0.005) {
      return `/stay/${stay._id}` as const;
    }
    return null;
  }, [stay]);

  useEffect(() => {
    if (!redirectTarget || typeof window === 'undefined') return;
    router.replace(redirectTarget);
  }, [redirectTarget, router]);

  const fiatOwed = computeFiatOwed(stay);
  const fiatCur =
    stay.priceLock?.total.cur || stay.fiatTarget?.cur || 'EUR';
  const amountLabel = formatStayMoney({
    val: fiatOwed,
    cur: fiatCur,
  });

  const cover =
    listing?.photos && listing.photos.length > 0
      ? `${cdn}${listing.photos[0]}-post-md.jpg`
      : null;

  const handleStripeConfirmation = async (
    checkout: StayCheckoutResponse,
    paymentMethodId: string,
  ): Promise<boolean> => {
    if (!checkout.paymentIntent) return true;
    const intent = checkout.paymentIntent;

    if (intent.status === 'succeeded') {
      await confirmStayCheckout(stay._id, intent.id);
      return true;
    }

    if (!stripe) {
      setActionError(t('stay_create_stripe_not_ready'));
      return false;
    }

    if (intent.status === 'requires_action' && intent.client_secret) {
      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: paymentMethodId,
      });
      if (result.error) {
        setActionError(result.error.message || t('stay_create_payment_failed'));
        return false;
      }
      if (result.paymentIntent?.status !== 'succeeded') {
        setActionError(t('stay_create_payment_failed'));
        return false;
      }
      await confirmStayCheckout(stay._id, intent.id);
      return true;
    }

    if (
      intent.status === 'requires_confirmation' &&
      intent.client_secret &&
      paymentMethodId
    ) {
      const result = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: paymentMethodId,
      });
      if (result.error) {
        setActionError(result.error.message || t('stay_create_payment_failed'));
        return false;
      }
      if (result.paymentIntent?.status !== 'succeeded') {
        setActionError(t('stay_create_payment_failed'));
        return false;
      }
      await confirmStayCheckout(stay._id, intent.id);
      return true;
    }

    setActionError(t('stay_create_payment_failed'));
    return false;
  };

  const handlePay = async () => {
    setActionError(null);
    setIsProcessing(true);
    try {
      if (fiatOwed <= 0.005) {
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

      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card,
        billing_details: { email: userEmail, name: userName },
      });
      if (pmError || !paymentMethod) {
        setActionError(pmError?.message || t('stay_create_card_error'));
        return;
      }

      const checkout = await checkoutStay(stay._id, paymentMethod.id);

      if (checkout.paymentIntent) {
        const ok = await handleStripeConfirmation(checkout, paymentMethod.id);
        if (!ok) return;
      }

      if (checkout.needsTokenStake) {
        await refetchStay();
        router.replace(`/stay/create/${stay._id}`);
        return;
      }

      const refreshed = await refetchStay();
      if (refreshed && isStayPaid(refreshed)) {
        router.replace(`/stay/${refreshed._id}/confirmation`);
      } else if (refreshed && isStayAwaitingPayment(refreshed)) {
        router.replace(`/stay/create/${stay._id}`);
      } else {
        router.replace(`/stay/${stay._id}`);
      }
    } catch (err) {
      setActionError(parseMessageFromError(err));
    } finally {
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
          <Heading
            id="stay-payment-summary-heading"
            level={2}
            className="text-base mb-2"
          >
            {t('stay_payment_page_summary_title')}
          </Heading>
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
                      {t('stay_create_guests_summary', {
                        adults: stay.adults,
                        children: stay.children || 0,
                      })}
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

            <div className="h-px w-full bg-foreground/[0.08]" />

            <div>
              <div className="flex flex-row items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink min-w-0">
                  {t('stay_payment_page_amount_title')}
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 tabular-nums text-right shrink-0">
                  {amountLabel}
                </p>
              </div>
              {stay.paymentDelta?.fiat && stay.paymentDelta.fiat.val > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                  {t('stay_payment_page_delta_note')}
                </p>
              )}
            </div>
          </div>
        </BookingSurface>

        <BookingSurface tone="elevated" padding="lg" as="section">
          <Heading level={2} className="text-lg mb-4">
            {t('stay_create_card_title')}
          </Heading>
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
          <p className="mt-2 text-xs text-gray-500">
            {t('stay_create_card_disclaimer')}
          </p>

          <div role="alert" aria-live="assertive" className="empty:hidden">
            {actionError && (
              <div className="mt-3">
                <ErrorMessage error={actionError} />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {fiatOwed > 0.005 ? (
              <Button
                isEnabled={!isProcessing}
                isLoading={isProcessing}
                onClick={() => void handlePay()}
                className="min-h-[48px]"
              >
                {t('stay_payment_page_pay_button')}
              </Button>
            ) : null}
            <Link
              href={`/stay/create/${stay._id}`}
              className="text-center text-sm text-accent underline font-medium"
            >
              {t('stay_payment_page_full_checkout_link')}
            </Link>
          </div>
        </BookingSurface>
      </div>
    </main>
  );
}

const StayPaymentPage = ({
  bookingSettings,
  generalConfig,
  error,
}: Props) => {
  const router = useRouter();
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const idParam = router.query.slug ?? router.query.id;
  const stayId = typeof idParam === 'string' ? idParam : idParam?.[0];

  const isBookingEnabled =
    !!bookingSettings && process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [stay, setStay] = useState<Stay | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const refetchStay = useCallback(async () => {
    if (!stayId) return null;
    const next = await getStay(stayId);
    setStay(next);
    return next;
  }, [stayId]);

  useEffect(() => {
    if (!router.isReady || !stayId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setPageError(null);
      try {
        const next = await getStay(stayId);
        if (cancelled) return;
        setStay(next);
        if (next.listing) {
          try {
            const { data } = await api.get(`/listing/${next.listing}`);
            if (!cancelled) setListing(data?.results ?? null);
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
    };
  }, [router.isReady, stayId]);

  if (error) return <PageError error={error} />;
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;

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

  if (isLoading) {
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
      <Elements stripe={stripePromise}>
        <StayPaymentInner
          stay={stay}
          listing={listing}
          refetchStay={refetchStay}
          userEmail={user?.email || ''}
          userName={user?.screenname || ''}
        />
      </Elements>
    </>
  );
};

StayPaymentPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;
    return { bookingSettings, generalConfig, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      generalConfig: null,
      messages: null,
    };
  }
};

export default StayPaymentPage;
