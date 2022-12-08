import { useRouter } from 'next/router';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import BookingStepsInfo from '../../../components/BookingStepsInfo';
import Layout from '../../../components/Layout';
import ListingCard from '../../../components/ListingCard';

import { BLOCKCHAIN_DAO_TOKEN } from '../../../config_blockchain';
import { useBookingActions } from '../../../contexts/booking';
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
  const { goBack, saveStepData } = useBookingActions();

  const bookListing = async ({ listingId }) => {
    try {
      const data = {
        listingId,
        useTokens,
        start,
        end,
        adults,
        kids,
        infants,
        pets,
      };
      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        ...data,
        listing: listingId,
        children: kids,
      });
      saveStepData(data);
      router.push(`/bookings/${newBooking._id}/questions`);
    } catch (err) {
      console.log(err); // TO DO handle error
    } finally {
    }
  };

  if (!start || !adults) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton goBack={goBack} />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_accomodation_step_title')}</span>
        </h1>
        <BookingProgress />
        <BookingStepsInfo
          startDate={start}
          endDate={end}
          totalGuests={adults}
          savedCurrency={currency}
        />

        <div className="mt-16 md:flex md:items-start md:gap-2">
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
    </Layout>
  );
};

AccomodationSelector.getInitialProps = async ({ query }) => {
  const { start, end, adults, kids, infants, pets, currency } = query || {};
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
    useTokens
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
  };
};

export default AccomodationSelector;
