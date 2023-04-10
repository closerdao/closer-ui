import { useRouter } from 'next/router';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingStepsInfo from '../../../components/BookingStepsInfo';
import ListingCard from '../../../components/ListingCard';
import ProgressBar from '../../../components/ui/ProgressBar';

import { type NextPage } from 'next';

import PageNotFound from '../../404';
import { blockchainConfig } from '../../../config_blockchain';
import { BOOKING_STEPS } from '../../../constants';
import { CloserCurrencies } from '../../../types';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

interface BaseParams {
  eventId?: string;
  volunteerId?: string;
  start?: string;
  end?: string;
  adults?: string;
  kids?: string;
  infants?: string;
  pets?: string;
  currency?: CloserCurrencies;
}

interface Props extends BaseParams {
  useTokens: boolean;
  listings: any[];
  error?: string;
}

const AccomodationSelector: NextPage<Props> = ({
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
  volunteerId,
}) => {
  const router = useRouter();
  const bookListing = async (listingId: string) => {
    try {
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
        ...(eventId && { eventId }),
        ...(volunteerId && { volunteerId }),
      });
      router.push(`/bookings/${newBooking._id}/questions`);
    } catch (err) {
      console.log(err); // TO DO handle error
    } finally {
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
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
      ...(volunteerId && { volunteerId }),
    };
    const urlParams = new URLSearchParams(params);
    router.push(`/bookings/create/dates?${urlParams}`);
  };

  return (
    <>
      <div className="max-w-screen-sm mx-auto md:first-letter:p-8">
        <BookingBackButton onClick={backToDates} name={__('buttons_back')} />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_accomodation_step_title')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
        <BookingStepsInfo
          startDate={start}
          endDate={end}
          totalGuests={adults}
          savedCurrency={currency}
          backToDates={backToDates}
        />

        {listings.length === 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold">
              {__('bookings_accomodation_no_results_title')}
            </h2>
            <p className="mt-4 text-lg">
              {__('bookings_accomodation_no_results_description')}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-4 mt-16 md:grid md:grid-cols-2 md:items-start">
          {listings.map((listing: any) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              bookListing={bookListing}
              useTokens={useTokens}
            />
          ))}
        </div>
      </div>
    </>
  );
};

AccomodationSelector.getInitialProps = async ({ query }) => {
  const {
    start,
    end,
    adults,
    kids,
    infants,
    pets,
    currency,
    eventId,
    volunteerId,
  }: BaseParams = query || {};
  const { BLOCKCHAIN_DAO_TOKEN } = blockchainConfig;
  const useTokens = currency === BLOCKCHAIN_DAO_TOKEN.symbol;
  const {
    data: { results },
  } = await api.post('/bookings/availability', {
    start,
    end,
    adults,
    children: kids,
    infants,
    pets,
    useTokens,
    ...(eventId && { eventId }),
    ...(volunteerId && { volunteerId }),
  });

  return {
    listings: results,
    start,
    end,
    adults,
    kids,
    infants,
    pets,
    currency,
    useTokens,
    eventId,
  };
};

export default AccomodationSelector;
