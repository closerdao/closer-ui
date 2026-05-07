import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageError from '../../../components/PageError';
import Slider from '../../../components/Slider';
import StaySearchBar, {
  StaySearchBarParams,
} from '../../../components/StaySearchBar';
import BackButton from '../../../components/ui/BackButton';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import config from '../../../configCached';
import { useConfig } from '../../../hooks/useConfig';
import { BookingSettings, GeneralConfig } from '../../../types/api';
import { Listing } from '../../../types/booking';
import { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { createStay, searchStays } from '../../../utils/stays.api';
import type { CloserCurrencies } from '../../../types/currency';

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  error?: string;
  messages?: any;
}

const PLATFORM_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const formatDate = (d: Date | string | null) =>
  d ? dayjs(d).format('YYYY-MM-DD') : '';

const StayCreatePage = ({ bookingSettings, generalConfig, error }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const isBookingEnabled =
    !!bookingSettings && process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const {
    start: savedStart,
    end: savedEnd,
    adults: savedAdults,
    children: savedChildren,
    infants: savedInfants,
    pets: savedPets,
  } = router.query || {};

  const initialAdults = Number(savedAdults) || 1;
  const initialChildren = Number(savedChildren) || 0;
  const initialInfants = Number(savedInfants) || 0;
  const initialPets = Number(savedPets) || 0;

  const isMember = !!user?.roles?.includes('member');
  const minNights = useMemo(() => {
    if (!bookingSettings) return 1;
    return isMember
      ? bookingSettings.memberMinDuration || 1
      : bookingSettings.minDuration || 1;
  }, [bookingSettings, isMember]);

  const defaultDateRange = useMemo(() => {
    const start = dayjs().add(14, 'day').startOf('day');
    const end = start.add(minNights, 'day');
    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    };
  }, [minNights]);

  const hasUrlDates = Boolean(savedStart && savedEnd);

  const [activeParams, setActiveParams] = useState<StaySearchBarParams | null>(
    () => {
      if (savedStart && savedEnd) {
        return {
          start: String(savedStart),
          end: String(savedEnd),
          adults: initialAdults,
          children: initialChildren,
          infants: initialInfants,
          pets: initialPets,
        };
      }
      return null;
    },
  );

  const nights = useMemo(() => {
    if (!activeParams) return 0;
    return Math.max(
      0,
      dayjs(activeParams.end).diff(dayjs(activeParams.start), 'day'),
    );
  }, [activeParams]);

  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState<string | null>(null);
  const [results, setResults] = useState<Listing[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [didSearchOnce, setDidSearchOnce] = useState(false);

  const buildQueryParams = (params: StaySearchBarParams) => {
    const out: Record<string, string> = {
      start: params.start,
      end: params.end,
      adults: String(params.adults),
    };
    if (params.children) out.children = String(params.children);
    if (params.infants) out.infants = String(params.infants);
    if (params.pets) out.pets = String(params.pets);
    return out;
  };

  const syncUrl = (params: StaySearchBarParams) => {
    router.replace(
      { pathname: '/stay/create', query: buildQueryParams(params) },
      undefined,
      { shallow: true },
    );
  };

  const runSearch = async (params: StaySearchBarParams) => {
    setSearchError(null);
    setIsSearching(true);
    setActiveParams(params);
    syncUrl(params);
    try {
      const { results: listings } = await searchStays({
        start: params.start,
        end: params.end,
        adults: params.adults,
        children: params.children,
      });
      setResults((listings as Listing[]) || []);
      setDidSearchOnce(true);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setResults([]);
      setDidSearchOnce(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickListing = async (listing: Listing) => {
    if (!activeParams) return;
    if (!isAuthenticated) {
      const params = new URLSearchParams(buildQueryParams(activeParams));
      const back = encodeURIComponent(`/stay/create?${params.toString()}`);
      router.push(`/signup?back=${back}`);
      return;
    }
    setIsCreatingDraft(listing._id);
    setSearchError(null);
    try {
      const stay = await createStay({
        listingId: listing._id,
        start: activeParams.start,
        end: activeParams.end,
        adults: activeParams.adults,
        children: activeParams.children,
        infants: activeParams.infants,
        pets: activeParams.pets,
      });
      router.push(`/stay/create/${stay._id}`);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setIsCreatingDraft(null);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (savedStart && savedEnd && !didSearchOnce) {
      void runSearch({
        start: String(savedStart),
        end: String(savedEnd),
        adults: initialAdults,
        children: initialChildren,
        infants: initialInfants,
        pets: initialPets,
      });
    }
  }, [router.isReady]);

  if (error) return <PageError error={error} />;
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;

  const pageTitle = `${t('stay_create_meta_title')} - ${PLATFORM_NAME}`;
  const pageDescription = t('stay_create_meta_description');
  const canonicalUrl = `${PLATFORM_URL}/stay/create`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content={`${PLATFORM_NAME}, accommodations, booking, stay, search, regenerative communities, ecovillage`}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main
        id="main-content"
        className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-12"
      >
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <BackButton handleClick={() => router.push('/stay')}>
            {t('buttons_back')}
          </BackButton>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <Heading level={1} className="text-3xl md:text-5xl mb-3">
            {t('stay_create_title')}
          </Heading>
          <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto">
            {t('stay_create_subtitle')}
          </p>
        </div>

        <div className="mb-8 md:mb-10">
          <StaySearchBar
            bookingSettings={bookingSettings}
            initialStart={
              hasUrlDates ? String(savedStart) : defaultDateRange.start
            }
            initialEnd={hasUrlDates ? String(savedEnd) : defaultDateRange.end}
            initialAdults={initialAdults}
            initialChildren={initialChildren}
            initialInfants={initialInfants}
            initialPets={initialPets}
            isSearching={isSearching}
            externalError={searchError}
            onSearch={runSearch}
          />
        </div>

        <section
          aria-label={t('stay_create_results_region_label')}
          aria-live="polite"
          aria-busy={isSearching}
        >
          {isSearching && (
            <div
              className="flex justify-center py-12"
              role="status"
              aria-label={t('stay_create_searching')}
            >
              <Spinner />
              <span className="sr-only">{t('stay_create_searching')}</span>
            </div>
          )}

          {!isSearching && didSearchOnce && results && results.length === 0 && (
            <div
              className="text-center py-12 border border-dashed rounded-xl"
              role="status"
            >
              <Heading level={2} className="text-lg mb-2">
                {t('stay_create_no_results_title')}
              </Heading>
              <p className="text-gray-600 max-w-md mx-auto">
                {t('stay_create_no_results_description')}
              </p>
            </div>
          )}

          {!isSearching && results && results.length > 0 && (
            <>
              <Heading level={2} className="text-xl mb-4 md:mb-6">
                {t('stay_create_results_title', { count: results.length })}
              </Heading>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 list-none p-0">
                {results.map((listing) => (
                  <li key={listing._id} className="contents">
                    <ListingResultCard
                      listing={listing}
                      nights={nights}
                      onPick={handlePickListing}
                      isCreating={isCreatingDraft === listing._id}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </>
  );
};

interface ListingResultCardProps {
  listing: Listing;
  nights: number;
  onPick: (listing: Listing) => void;
  isCreating: boolean;
}

const ListingResultCard = ({
  listing,
  nights,
  onPick,
  isCreating,
}: ListingResultCardProps) => {
  const t = useTranslations();
  const photos = (listing.photos || []).map((id: string) => ({
    image: `${cdn}${id}-post-md.jpg`,
  }));

  const dailyPrice = listing.fiatPrice?.val || 0;
  const totalEstimate = dailyPrice * Math.max(nights, 1);
  const currency = listing.fiatPrice?.cur as CloserCurrencies | undefined;
  const headingId = `listing-${listing._id}-name`;

  return (
    <article
      aria-labelledby={headingId}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg focus-within:shadow-lg focus-within:ring-2 focus-within:ring-accent transition-shadow"
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        {photos.length > 0 ? (
          <Slider slides={photos} reverse={false} isListingPreview />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-gray-300"
            aria-hidden="true"
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              focusable="false"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3
            id={headingId}
            className="text-base font-semibold text-gray-900 line-clamp-1"
          >
            {listing.name}
          </h3>
          <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
            {priceFormat(dailyPrice, currency)}
            <span className="text-gray-500 text-xs font-normal">
              {' '}
              / {t('listing_preview_night')}
            </span>
          </p>
        </div>

        {listing.description && (
          <p
            className="text-sm text-gray-600 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: listing.description.slice(0, 140),
            }}
          />
        )}

        {nights > 0 && (
          <p className="text-sm text-gray-600">
            {t('stay_create_listing_total_estimate', {
              total: priceFormat(totalEstimate, currency),
              nights,
            })}
          </p>
        )}

        <div className="mt-auto pt-2">
          <Button
            onClick={() => onPick(listing)}
            isLoading={isCreating}
            isEnabled={!isCreating}
            className="min-h-[44px]"
          >
            {t('stay_create_reserve_button')}
          </Button>
        </div>
      </div>
    </article>
  );
};

StayCreatePage.getInitialProps = async (context: NextPageContext) => {
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

export default StayCreatePage;
