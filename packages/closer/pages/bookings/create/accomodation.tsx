import { useRouter } from 'next/router';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingStepsInfo from '../../../components/BookingStepsInfo';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import ListingCard from '../../../components/ListingCard';
import { ErrorMessage } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { blockchainConfig } from '../../../config_blockchain';
import { BOOKING_STEPS, BOOKING_STEP_TITLE_KEYS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import {
  BaseBookingParams,
  BookingConfig,
  Event,
  Listing,
} from '../../../types';
import api from '../../../utils/api';
import {
  buildBookingAccomodationUrl,
  buildBookingDatesUrl,
  getBookingTokenCurrency,
  getBookingType,
} from '../../../utils/booking.helpers';
import { normalizeIsFriendsBooking } from '../../../utils/bookingUtils';
import { getBookingRate, getDiscountRate } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageNotFound from '../../not-found';

dayjs.extend(advancedFormat);

interface Props extends BaseBookingParams {
  listings: Listing[];
  error?: string;
  bookingConfig: BookingConfig | null;
  bookingError?: string | null;
  event: Event | null;
  tokenCurrency: string;
}

const AccomodationSelector = ({
  error,
  start,
  end,
  adults,
  kids,
  infants,
  pets,
  currency,
  useTokens,
  listings,
  eventId,
  ticketOption,
  discountCode,
  doesNeedPickup,
  doesNeedSeparateBeds,
  bookingConfig,
  bookingError,
  foodOption,
  skills,
  diet,
  suggestions,
  bookingType,
  projectId,
  volunteerId,
  isFriendsBooking,
  friendEmails,
  event,
  tokenCurrency,
}: Props) => {
  const t = useTranslations();

  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const normalizedIsFriendsBooking =
    normalizeIsFriendsBooking(isFriendsBooking);
  const durationInDays = dayjs(end).diff(dayjs(start), 'day');

  const durationName = getBookingRate(durationInDays);

  const discountRate = bookingConfig
    ? 1 - getDiscountRate(durationName, bookingConfig)
    : 0;

  const parsedSkills =
    (skills && Array.isArray(skills) ? skills : skills?.split(',')) || [];
  const parsedDiet =
    (diet && Array.isArray(diet) ? diet : diet?.split(',')) || [];
  const parsedProjectId =
    (projectId && Array.isArray(projectId)
      ? projectId
      : projectId?.split(',')) || [];

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const isTeamMember = user?.roles.some((roles) =>
    ['space-host', 'steward', 'land-manager', 'team'].includes(roles),
  );

  const filteredListings =
    listings &&
    listings?.filter((listing: Listing) => {
      if (isTeamMember && listing.availableFor?.includes('team')) {
        return listing.availableFor?.includes('team');
      } else if (bookingType) {
        return listing.availableFor?.includes('volunteer');
      } else if (eventId) {
        return listing.availableFor?.includes('events');
      } else {
        return listing.availableFor?.includes('guests');
      }
    });

  const bookingCategory = getBookingType(eventId, bookingType, volunteerId);

  const bookListing = async (listingId: string) => {
    try {
      const volunteerInfo = (bookingType === 'volunteer' ||
        bookingType === 'residence') && {
        skills: parsedSkills,
        diet: parsedDiet,
        projectId: parsedProjectId,
        suggestions: suggestions || '',
        bookingType,
      };
      const eventFoodPayload =
        event && event.foodOption
          ? {
              foodOption: event.foodOption,
              foodOptionId:
                event.foodOption === 'food_package'
                  ? event.foodOptionId ?? null
                  : null,
            }
          : {};

      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        useTokens,
        start,
        end,
        adults,
        infants,
        pets,
        listing: listingId,
        children: kids,
        discountCode,
        ...(eventId && { eventId, ticketOption }),
        doesNeedPickup,
        doesNeedSeparateBeds,
        ...(event ? eventFoodPayload : { foodOption }),
        ...(volunteerInfo && { volunteerInfo }),
        ...(normalizedIsFriendsBooking && { isFriendsBooking: true }),
        ...(friendEmails && { friendEmails }),
      });
      if (bookingConfig?.foodOptionEnabled) {
        router.push(
          `/bookings/${newBooking._id}/food?discountCode=${discountCode}`,
        );
        return;
      }

      router.push(`/bookings/${newBooking._id}/questions`);
    } catch (err) {
    } finally {
    }
  };

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }
  if (error) {
    return <PageNotFound error={error} />;
  }

  if (!start || !adults || !end) {
    return null;
  }

  const stepUrlParams = {
    start,
    end,
    adults: Number(adults),
    ...(kids && { children: Number(kids) }),
    ...(infants && { infants: Number(infants) }),
    ...(pets && { pets: Number(pets) }),
    ...(currency && { currency }),
    ...(eventId && { eventId }),
    ...(volunteerId && { volunteerId }),
    ...(bookingType && {
      volunteerInfo: {
        bookingType,
        ...(parsedSkills.length && { skills: parsedSkills }),
        ...(parsedDiet.length && { diet: parsedDiet }),
        ...(parsedProjectId.length && { projectId: parsedProjectId }),
        ...(suggestions && { suggestions }),
      },
    }),
    ...(normalizedIsFriendsBooking && { isFriendsBooking: true }),
    ...(friendEmails && { friendEmails }),
  };

  const backToDates = () => {
    router.push(buildBookingDatesUrl(stepUrlParams));
  };

  return (
    <>
      <div className="max-w-screen-sm mx-auto p-4 md:p-8">
        <div className="relative flex items-center min-h-[2.75rem] mb-6">
          <BookingBackButton onClick={backToDates} name={t('buttons_back')} className="relative z-10" />
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
            <Heading className="text-2xl md:text-3xl pb-0 mt-0 text-center">
              <span>{t('bookings_accomodation_step_title')}</span>
            </Heading>
          </div>
        </div>
        <FriendsBookingBlock isFriendsBooking={normalizedIsFriendsBooking} />
        <ProgressBar
          steps={BOOKING_STEPS}
          stepTitleKeys={BOOKING_STEP_TITLE_KEYS}
          stepHrefs={[
            buildBookingDatesUrl(stepUrlParams),
            buildBookingAccomodationUrl({
              ...stepUrlParams,
              currency: useTokens ? tokenCurrency : stepUrlParams.currency,
            }),
            null,
            null,
            null,
            null,
            null,
          ]}
        />
        <BookingStepsInfo
          startDate={start}
          endDate={end}
          totalGuests={adults}
          savedCurrency={currency}
          useTokens={Boolean(useTokens)}
          backToDates={backToDates}
        />
        {bookingError && (
          <section className="my-12">
            <ErrorMessage error={bookingError} />
          </section>
        )}
        {filteredListings?.length === 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold">
              {t('bookings_accomodation_no_results_title')}
            </h2>
            <p className="mt-4 text-lg">
              {t('bookings_accomodation_no_results_description')}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-8 md:grid md:grid-cols-2 md:items-start">
          {filteredListings &&
            filteredListings?.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                bookListing={bookListing}
                useTokens={Boolean(useTokens)}
                bookingCategory={bookingCategory}
                isAuthenticated={isAuthenticated}
                adults={Number(adults)}
                isVolunteerOrResidency={Boolean(bookingType)}
                durationInDays={durationInDays}
                discountRate={discountRate}
              />
            ))}
        </div>
      </div>
    </>
  );
};

AccomodationSelector.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;

  try {
    const {
      start,
      end,
      adults,
      kids,
      infants,
      pets,
      currency,
      eventId,
      ticketOption,
      discountCode,
      doesNeedPickup,
      doesNeedSeparateBeds,
      isFriendsBooking: normalizedIsFriendsBooking,
      friendEmails,
      foodOption,
      skills,
      diet,
      projectId,
      suggestions,
      bookingType,
      volunteerId,
    }: BaseBookingParams = query || {};
    const { BLOCKCHAIN_DAO_TOKEN } = blockchainConfig;
    const useTokens = currency === BLOCKCHAIN_DAO_TOKEN.symbol;

    const [availabilityRes, bookingConfigRes, web3ConfigRes, messages] =
      await Promise.all([
        api
          .post('/bookings/availability', {
          start,
          end,
          adults,
          children: kids,
          infants,
          pets,
          useTokens,
          isFriendsBooking: normalizedIsFriendsBooking,
          discountCode,
          ...(eventId && { eventId, ticketOption }),
        })
        .catch((err: any) => {
          console.error(
            'Error fetching availability data:',
            err.response.data.error,
          );
          return { error: err.response.data.error || 'Unknown error' };
        }),
        api.get('/config/booking').catch(() => null),
        api.get('/config/web3').catch(() => null),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);
    const bookingError = (availabilityRes as any)?.error || null;
    const availability = (availabilityRes as any)?.data?.results;

    const bookingConfig = bookingConfigRes?.data?.results?.value;
    const web3Config = web3ConfigRes?.data?.results?.value;
    const tokenCurrency = getBookingTokenCurrency(web3Config, bookingConfig);

    let event = null;
    if (eventId) {
      const eventRes = await api.get(`/event/${eventId}`).catch(() => null);
      event = eventRes?.data?.results ?? null;
    }

    return {
      listings: availability,
      start,
      end,
      adults,
      kids,
      infants,
      pets,
      currency,
      useTokens,
      eventId,
      ticketOption,
      discountCode,
      doesNeedPickup,
      doesNeedSeparateBeds,
      isFriendsBooking: normalizedIsFriendsBooking,
      friendEmails,
      bookingConfig,
      bookingError,
      messages,
      foodOption,
      skills,
      diet,
      projectId,
      suggestions,
      bookingType,
      volunteerId,
      event,
      tokenCurrency,
    };
  } catch (err: any) {
    return {
      error: err.response?.data?.error || err.message,
      bookingConfig: null,
      messages: null,
      tokenCurrency: getBookingTokenCurrency(),
    };
  }
};

export default AccomodationSelector;
