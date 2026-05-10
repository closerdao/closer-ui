import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import ConfirmationCelebrationOverlay, {
  CONFIRMATION_CELEBRATION_DURATION_MS,
} from '../../../components/ConfirmationCelebrationOverlay';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageError from '../../../components/PageError';
import { ErrorMessage } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { BookingSettings, GeneralConfig } from '../../../types/api';
import { Listing } from '../../../types/booking';
import { Stay } from '../../../types/stay';
import api, { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import {
  formatStayMoney,
  getStay,
  isStayPaid,
  isStayTerminal,
} from '../../../utils/stays.api';

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  error?: string;
  messages?: any;
}

const StayConfirmationPage = ({
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
  const [showCelebration, setShowCelebration] = useState(true);
  const isCelebratory = !!stay && isStayPaid(stay);

  useEffect(() => {
    if (!router.isReady || !stayId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
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

  useEffect(() => {
    if (!stay?._id || !isCelebratory) return;
    const timer = setTimeout(
      () => setShowCelebration(false),
      CONFIRMATION_CELEBRATION_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [stay?._id, isCelebratory]);

  if (error) return <PageError error={error} />;
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;

  const pageTitle = `${t('stay_create_confirmation_meta_title')} - ${PLATFORM_NAME}`;

  const SeoHead = (
    <Head>
      <title>{pageTitle}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta
        name="description"
        content={t('stay_create_confirmation_meta_description')}
      />
    </Head>
  );

  if (!isAuthenticated) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="max-w-3xl mx-auto p-4 md:p-6 text-center"
        >
          <Heading level={1}>{t('stay_create_login_required_title')}</Heading>
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
          <span className="sr-only">{t('stay_create_loading')}</span>
        </main>
      </>
    );
  }

  if (pageError || !stay) {
    return (
      <>
        {SeoHead}
        <main id="main-content" className="max-w-3xl mx-auto p-4 md:p-6">
          <div role="alert" aria-live="assertive">
            <ErrorMessage error={pageError || t('stay_create_not_found')} />
          </div>
        </main>
      </>
    );
  }

  if (stay.status === 'pending') {
    if (typeof window !== 'undefined') {
      router.replace(`/stay/${stay._id}/pending`);
    }
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
          <span className="sr-only">{t('stay_create_loading')}</span>
        </main>
      </>
    );
  }

  if (!isStayPaid(stay) && !isStayTerminal(stay)) {
    if (typeof window !== 'undefined') {
      router.replace(`/stay/create/${stay._id}`);
    }
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
          <span className="sr-only">{t('stay_create_loading')}</span>
        </main>
      </>
    );
  }

  const cover =
    listing?.photos && listing.photos.length > 0
      ? `${cdn}${listing.photos[0]}-post-md.jpg`
      : null;

  const options = [
    stay.doesNeedPickup ? t('stay_create_option_pickup') : null,
    stay.doesNeedSeparateBeds ? t('stay_create_option_separate_beds') : null,
  ].filter(Boolean);

  return (
    <>
      {SeoHead}
      <ConfirmationCelebrationOverlay
        show={isCelebratory && showCelebration}
        title={t('stay_create_confirmation_title')}
      />

      <main
        id="main-content"
        className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12"
      >
        <div className="text-center mb-8 md:mb-10">
          <div
            aria-hidden="true"
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/10 mb-5"
          >
            <svg
              className="w-8 h-8 md:w-10 md:h-10 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              focusable="false"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <Heading
            level={1}
            className="text-3xl md:text-4xl mb-3"
            role={isCelebratory ? 'status' : undefined}
            aria-live={isCelebratory ? 'polite' : undefined}
          >
            {isCelebratory
              ? t('stay_create_confirmation_title')
              : t(`stay_status_${stay.status}_title`)}
          </Heading>
          <p className="text-gray-600 max-w-md mx-auto">
            {isCelebratory
              ? t('stay_create_confirmation_description', {
                  email: user?.email || '',
                })
              : t(`stay_status_${stay.status}_description`)}
          </p>
        </div>

        <article
          aria-labelledby="confirmation-listing-heading"
          className="rounded-2xl border border-gray-200 overflow-hidden bg-white"
        >
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
              className="w-full h-48 md:h-56 object-cover"
            />
          )}
          <div className="p-4 md:p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                {t('stay_create_listing_label')}
              </p>
              <h2
                id="confirmation-listing-heading"
                className="text-lg font-semibold text-gray-900 mt-1 break-words"
              >
                {listing?.name || t('stay_create_listing_unknown')}
              </h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {t('stay_create_arrival')}
                </dt>
                <dd className="text-gray-900 mt-1">
                  <time dateTime={stay.start}>
                    {dayjs(stay.start).format('ddd, MMM D YYYY')}
                  </time>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {t('stay_create_departure')}
                </dt>
                <dd className="text-gray-900 mt-1">
                  <time dateTime={stay.end}>
                    {dayjs(stay.end).format('ddd, MMM D YYYY')}
                  </time>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {t('stay_create_guests_label')}
                </dt>
                <dd className="text-gray-900 mt-1">
                  {t('stay_create_guests_summary', {
                    adults: stay.adults,
                    children: stay.children || 0,
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {t('stay_create_status_label')}
                </dt>
                <dd className="text-gray-900 capitalize mt-1">
                  {stay.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {t('stay_create_nights_label')}
                </dt>
                <dd className="text-gray-900 mt-1">
                  {t('bookings_dates_nights_selected', { count: stay.duration || 0 })}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {t('stay_create_booking_id_label')}
                </dt>
                <dd className="text-gray-900 mt-1 break-all">{stay._id}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                  {t('stay_create_options_title')}
                </dt>
                <dd className="text-gray-900 mt-1">
                  {options.length > 0
                    ? options.join(', ')
                    : t('stay_create_options_none')}
                </dd>
              </div>
            </dl>

            {stay.priceLock && (
              <div className="border-t pt-4 mt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t('stay_create_total_paid')}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatStayMoney(stay.priceLock.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{t('stay_create_line_tax')}</span>
                  <span>
                    {formatStayMoney(
                      stay.priceLock.vat ?? {
                        val: 0,
                        cur: stay.priceLock.total.cur,
                      },
                    )}
                  </span>
                </div>
                {stay.priceLock.appliedCredits.val > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {t('stay_create_line_credits_applied')}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {`${stay.priceLock.appliedCredits.val} ${stay.priceLock.appliedCredits.cur}`}
                    </span>
                  </div>
                )}
                {stay.priceLock.appliedTokens.val > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {t('stay_create_line_tokens_applied')}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {`${stay.priceLock.appliedTokens.val} ${stay.priceLock.appliedTokens.cur}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>

        <nav
          aria-label={t('stay_create_confirmation_actions_label')}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            href={`/stay/${stay._id}`}
            className="text-center rounded-full px-6 py-3 border-2 border-accent text-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 min-h-[44px] inline-flex items-center justify-center"
          >
            {t('stay_create_view_booking')}
          </Link>
          <Button
            isFullWidth={false}
            className="px-8 min-h-[44px]"
            onClick={() => router.push('/stay/create')}
          >
            {t('stay_create_book_another')}
          </Button>
        </nav>
      </main>
    </>
  );
};

StayConfirmationPage.getInitialProps = async (context: NextPageContext) => {
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

export default StayConfirmationPage;
