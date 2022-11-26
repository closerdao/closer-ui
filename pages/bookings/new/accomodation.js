import { useEffect, useState } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import { BookingProgress } from '../../../components/BookingProgress';
import Layout from '../../../components/Layout';
import { ListingCard } from '../../../components/ListingCard';

import daysjs from 'dayjs';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const AccomodationSelector = () => {
  const { steps } = useBookingState();
  const dates = steps.find((step) => step.path === '/bookings/new/dates').data;
  const { startDate, endDate, guests, useToken } = dates || {};
  const { adults, kids, infants, pets } = guests || {};
  console.log('dates', dates);
  console.log('guests', guests);
  console.log('useToken', useToken);
  const { saveStepData, goToNextStep, startNewBooking } = useBookingActions();

  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        setIsLoading(true);
        const {
          data: { results: availableListings },
        } = await api.post('/bookings/availability', {
          start: startDate,
          end: endDate,
          adults,
          children: kids,
          infants,
          pets,
          useToken,
        });
        setListings(availableListings);
      } catch (err) {
        console.log(err); // TO DO handle error
      } finally {
        setIsLoading(false);
      }
    };
    console.log('useEffect', startDate, adults, useToken);
    if (startDate && adults) {
      checkAvailability();
    }
  }, [startDate, adults, useToken]);

  const bookListing = async ({
    listingId,
    listingName,
    rentalFiat,
    rentalToken,
    utilityFiat,
    dailyRentalToken,
  }) => {
    try {
      setIsCreatingBooking(true);
      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        listing: listingId,
        useToken,
        startDate,
        endDate,
        ...guests,
      });
      if (newBooking._id) {
        saveStepData({
          listingId,
          listingName,
          bookingId: newBooking._id,
          totalCostFiat: rentalFiat,
          totalCostToken: rentalToken,
          totalCostUtility: utilityFiat,
          dailyRentalToken,
        });
        goToNextStep();
      }
    } catch (err) {
      console.log(err); // TO DO handle error
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (!startDate || !adults) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_accomodation_step_title')}</span>
        </h1>
        <BookingProgress />
        <div className="mt-6 flex justify-between gap-2 flex-nowrap md:justify-start">
          <div className="border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center">
            <span className="mr-1">📆</span>
            <span>
              {daysjs(dates?.startDate).format('MMM DD')} -{' '}
              {daysjs(dates?.endDate).format('MMM DD')}
            </span>
          </div>
          <div className="flex-1 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center md:flex-initial md:w-40">
            <span className="mr-1">👨‍👩‍👦</span>
            <span>{`${guests?.totalGuests} ${__(
              'booking_accomodation_step_guest',
            )}`}</span>
          </div>
        </div>
        <div className="mt-16 md:flex md:items-start md:gap-2">
          {isLoading && <p>Loading...</p>}
          {!isLoading &&
            listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                bookListing={bookListing}
                isCreatingBooking={isCreatingBooking}
              />
            ))}
        </div>
      </div>
    </Layout>
  );
};

export default AccomodationSelector;
