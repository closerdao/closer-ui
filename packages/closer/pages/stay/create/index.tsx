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
import { FoodOption } from '../../../types/food';
import type { StaySearchListing } from '../../../types/durationDiscount';
import api, { cdn } from '../../../utils/api';
import StayListingAccommodationPrice from '../../../components/booking/stayListingAccommodationPrice';
import StayListingUnitsCard from '../../../components/booking/stayListingUnitsCard';
import {
  getDefaultSelectedFoodOptionId,
  getFoodOptionsForBookingContext,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { createStay, searchStays } from '../../../utils/stays.api';

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  defaultGuestFoodOptionId?: string | null;
  error?: string;
  messages?: any;
}

const PLATFORM_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const formatDate = (d: Date | string | null) =>
  d ? dayjs(d).format('YYYY-MM-DD') : '';

const StayCreatePage = ({
  bookingSettings,
  generalConfig,
  defaultGuestFoodOptionId,
  error,
}: Props) => {
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
    listingId: listingIdQuery,
  } = router.query || {};

  const listingId =
    typeof listingIdQuery === 'string'
      ? listingIdQuery
      : Array.isArray(listingIdQuery)
        ? listingIdQuery[0]
        : undefined;

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

  const [searchDuration, setSearchDuration] = useState(0);

  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState<string | null>(null);
  const [results, setResults] = useState<StaySearchListing[] | null>(null);
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
    if (listingId) out.listingId = listingId;
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
      const searchResponse = await searchStays({
        start: params.start,
        end: params.end,
        adults: params.adults,
        children: params.children,
      });
      const apiDuration = Number(searchResponse.duration) || 0;
      setSearchDuration(apiDuration);
      let listings = searchResponse.results || [];
      if (listingId) {
        const match = listings.find((l) => l._id === listingId);
        if (match) {
          listings = [match];
        } else {
          try {
            const { data } = await api.get(`/listing/${listingId}`);
            if (data?.results) {
              listings = [data.results as StaySearchListing];
            } else {
              listings = [];
            }
          } catch {
            listings = [];
          }
        }
      }
      setResults(listings);
      setDidSearchOnce(true);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setSearchDuration(0);
      setResults([]);
      setDidSearchOnce(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickListing = async (listing: StaySearchListing) => {
    if (!activeParams) return;
    if (listing.available === false) return;
    if (!isAuthenticated) {
      const qs = new URLSearchParams(
        buildQueryParams(activeParams) as Record<string, string>,
      );
      const back = encodeURIComponent(`/stay/create?${qs.toString()}`);
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
        ...(bookingSettings?.foodOptionEnabled && defaultGuestFoodOptionId
          ? {
              foodOption: 'food_package',
              foodOptionId: defaultGuestFoodOptionId,
            }
          : {}),
      });
      router.push(`/stay/create/${stay._id}`);
    } catch (err) {
      setSearchError(parseMessageFromError(err));
      setIsCreatingDraft(null);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (didSearchOnce) return;
    if (savedStart && savedEnd) {
      void runSearch({
        start: String(savedStart),
        end: String(savedEnd),
        adults: initialAdults,
        children: initialChildren,
        infants: initialInfants,
        pets: initialPets,
      });
      return;
    }
    if (listingId) {
      void runSearch({
        start: defaultDateRange.start,
        end: defaultDateRange.end,
        adults: initialAdults,
        children: initialChildren,
        infants: initialInfants,
        pets: initialPets,
      });
    }
  }, [router.isReady, listingId, didSearchOnce, savedStart, savedEnd]);

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
              {listingId && results.length === 1 && (
                <Heading
                  level={2}
                  className="text-xl mb-4 md:mb-6 text-center md:text-left"
                >
                  {t('stay_create_focused_results_heading', {
                    name: results[0].name,
                  })}
                </Heading>
              )}
              {listingId && results.length === 1 && (
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-center md:text-left">
                  {t('stay_create_focused_results_intro')}
                </p>
              )}
              <ul
                className={
                  listingId && results.length === 1
                    ? 'max-w-2xl mx-auto flex flex-col gap-6 list-none p-0 w-full'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 list-none p-0'
                }
              >
                {results.map((listing) => (
                  <li key={listing._id} className="contents">
                    <ListingResultCard
                      listing={listing}
                      duration={searchDuration}
                      onPick={handlePickListing}
                      isCreating={isCreatingDraft === listing._id}
                      layoutFocused={Boolean(listingId && results.length === 1)}
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

const stripHtml = (html: string): string =>
  html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';

interface ListingResultCardProps {
  listing: StaySearchListing;
  duration: number;
  onPick: (listing: StaySearchListing) => void;
  isCreating: boolean;
  layoutFocused?: boolean;
}

const ListingResultCard = ({
  listing,
  duration,
  onPick,
  isCreating,
  layoutFocused = false,
}: ListingResultCardProps) => {
  const t = useTranslations();
  const photos = (listing.photos || []).map((id: string) => ({
    image: `${cdn}${id}-post-md.jpg`,
  }));

  const headingId = `listing-${listing._id}-name`;
  const descriptionPreview = listing.description
    ? stripHtml(listing.description).slice(0, 140)
    : '';
  const isUnavailable = listing.available === false;

  return (
    <article
      aria-labelledby={headingId}
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg focus-within:shadow-lg focus-within:ring-2 focus-within:ring-accent transition-shadow ${
        layoutFocused ? 'shadow-md md:flex-row md:items-stretch md:max-h-none' : ''
      } ${isUnavailable ? 'opacity-75' : ''}`}
    >
      <div
        className={`bg-gray-100 overflow-hidden shrink-0 ${
          layoutFocused
            ? 'aspect-[16/10] md:w-[min(44%,420px)] md:aspect-auto md:min-h-[280px]'
            : 'aspect-[4/3]'
        }`}
      >
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
      <div
        className={`flex flex-col gap-3 flex-1 ${
          layoutFocused ? 'p-5 md:p-6 md:justify-center' : 'p-4'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            id={headingId}
            className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug min-w-0 flex-1"
          >
            {listing.name}
          </h3>
          <StayListingUnitsCard listing={listing} />
        </div>

        {descriptionPreview && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {descriptionPreview}
          </p>
        )}

        <StayListingAccommodationPrice listing={listing} duration={duration} />

        <div className="mt-auto pt-2">
          <Button
            onClick={() => onPick(listing)}
            isLoading={isCreating}
            isEnabled={!isCreating && !isUnavailable}
            className="min-h-[44px]"
          >
            {isUnavailable
              ? t('listing_preview_not_available')
              : t('stay_create_reserve_button')}
          </Button>
        </div>
      </div>
    </article>
  );
};

StayCreatePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;

    let defaultGuestFoodOptionId: string | null = null;
    if (bookingSettings?.foodOptionEnabled) {
      const foodRes = await api.get('/food').catch(() => null);
      const foodOptions: FoodOption[] = foodRes?.data?.results ?? [];
      const guestFiltered = getFoodOptionsForBookingContext(
        foodOptions,
        'guests',
      );
      const pool =
        guestFiltered.length > 0 ? guestFiltered : foodOptions;
      defaultGuestFoodOptionId = getDefaultSelectedFoodOptionId(pool);
    }

    return {
      bookingSettings,
      generalConfig,
      defaultGuestFoodOptionId,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      generalConfig: null,
      defaultGuestFoodOptionId: null,
      };
  }
};

export default StayCreatePage;
