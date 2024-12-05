import { useRouter } from 'next/router';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingStepsInfo from '../../../components/BookingStepsInfo';
import ListingCard from '../../../components/ListingCard';
import { ErrorMessage } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs, { duration } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { blockchainConfig } from '../../../config_blockchain';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import {
  BaseBookingParams,
  BookingConfig,
  Event,
  Listing,
} from '../../../types';
import api from '../../../utils/api';
import { getBookingType } from '../../../utils/booking.helpers';
import { getBookingRate, getDiscountRate } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

dayjs.extend(advancedFormat);

interface Props extends BaseBookingParams {
  listings: Listing[];
  error?: string;
  bookingConfig: BookingConfig | null;
  bookingError?: string | null;
  optionalEvent: Event | null;
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
}: Props) => {
  const t = useTranslations();

  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  console.log('duration=', duration);
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
      if (isTeamMember) {
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
      const volunteerInfo =
        (bookingType === 'volunteer' || bookingType === 'residence') && {
          skills: parsedSkills,
          diet: parsedDiet,
          projectId: parsedProjectId,
          suggestions: suggestions || '',
          bookingType,
      };
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
        foodOption,
        ...(volunteerInfo && { volunteerInfo }),
      });
      if (bookingConfig?.foodOptionEnabled) {
        router.push(
          `/bookings/${newBooking._id}/food?discountCode=${discountCode}`,
        );
        return;
      }

      router.push(`/bookings/${newBooking._id}/questions`);
    } catch (err) {
      console.log(err); // TO DO handle error
    } finally {
    }
  };

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }
  if (error) {
    return <PageNotFound error={error} />;
  }

  if (!start || !adults || !end) {
    return null;
  }

  const backToDates = () => {
    const params = {
      start,
      end,
      adults,
      ...(kids && { kids }),
      ...(infants && { infants }),
      ...(pets && { pets }),
      ...(currency && { currency }),
      ...(eventId && { eventId }),
      ...(bookingType && { bookingType }),
      ...(skills && { skills }),
      ...(diet && { diet }),
      ...(suggestions && { suggestions }),
    };
    const urlParams = new URLSearchParams(params);
    router.push(`/bookings/create/dates?${urlParams}`);
  };

  return (
    <>
      <div className="max-w-screen-sm mx-auto md:first-letter:p-8">
        <BookingBackButton onClick={backToDates} name={t('buttons_back')} />
        <Heading className="pb-4 mt-8">
          <span className="mr-2">🏡</span>
          <span>{t('bookings_accomodation_step_title')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />
        <BookingStepsInfo
          startDate={start}
          endDate={end}
          totalGuests={adults}
          savedCurrency={currency}
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
        <div className="flex flex-col gap-4 mt-16 md:grid md:grid-cols-2 md:items-start">
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

    const [availabilityRes, bookingConfigRes, messages] = await Promise.all([
      api
        .post('/bookings/availability', {
          start,
          end,
          adults,
          children: kids,
          infants,
          pets,
          useTokens,
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
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const bookingError = (availabilityRes as any)?.error || null;
    const availability = (availabilityRes as any)?.data?.results;

    const bookingConfig = bookingConfigRes?.data?.results?.value;

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
    };
  } catch (err: any) {
    console.log(err);
    return {
      error: err.response?.data?.error || err.message,
      bookingConfig: null,
      messages: null,
    };
  }
};

export default AccomodationSelector;

