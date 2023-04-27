import { useRouter } from 'next/router';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import BookingStepsInfo from '../../../components/BookingStepsInfo';
import ListingCard from '../../../components/ListingCard';
import Heading from '../../../components/ui/Heading';

import PageNotFound from '../../404';
import { blockchainConfig } from '../../../config_blockchain';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const AccomodationSelector = ({
  start,
  end,
  adults,
  kids,
  infants,
  pets,
  currency,
  useTokens,
  listings,
}) => {
  const router = useRouter();
  const bookListing = async ({ listingId }) => {
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
      kids,
      infants,
      pets,
      currency,
    };
    const urlParams = new URLSearchParams(params);
    router.push(`/bookings/create/dates?${urlParams}`);
  };

  return (
    <>
      <div className="max-w-screen-sm mx-auto md:first-letter:p-8">
        <BookingBackButton action={backToDates} name={__('buttons_back')} />
        <Heading className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_accomodation_step_title')}</span>
        </Heading>
        <BookingProgress />
        <BookingStepsInfo
          startDate={start}
          endDate={end}
          totalGuests={adults}
          savedCurrency={currency}
          backToDates={backToDates}
        />

        {listings.length === 0 && (
          <div className="mt-16">
            <Heading level={2} className="text-2xl font-bold">
              {__('bookings_accomodation_no_results_title')}
            </Heading>
            <p className="mt-4 text-lg">
              {__('bookings_accomodation_no_results_description')}
            </p>
          </div>
        )}
        <div className="mt-16 md:grid md:grid-flow-col md:items-start md:gap-2">
          {listings.map((listing) => (
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
  const { start, end, adults, kids, infants, pets, currency } = query || {};
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
  });

  return {
    listings: results,
    start,
    end,
    adults: Number(adults),
    kids: Number(kids),
    infants: Number(infants),
    pets: Number(pets),
    currency,
    useTokens,
  };
};

export default AccomodationSelector;
