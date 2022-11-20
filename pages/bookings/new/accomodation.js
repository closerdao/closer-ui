import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import Layout from '../../../components/Layout';
import { ListingCard } from '../../../components/ListingCard';
import { Progress } from '../../../components/Progress';

import daysjs from 'dayjs';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const AccomodationSelector = () => {
  const { steps } = useBookingState();
  const dates = steps.find((step) => step.path === '/bookings/new/dates');
  const start = dates.data.startDate;
  const end = dates.data.endDate;
  const guests = steps.find(
    (step) => step.path === '/bookings/new/guests',
  ).data;
  const totalGuests = guests.adults + guests.children; // TO DO check if total guests are indeed only adults + children
  const { pathname } = useRouter();
  const currentStep = steps.find((step) => step.path === pathname);
  const currentStepIndex = steps.indexOf(currentStep);
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
        } = await api.post('/bookings/availability', { start, end, ...guests });
        setListings(availableListings);
      } catch (err) {
        console.log(err); // TO DO handle error
      } finally {
        setIsLoading(false);
      }
    };
    if (!dates.data.startDate || !guests.adults) {
      startNewBooking();
    }
    checkAvailability();
  }, []);

  const bookListing = async ({ listingId, useToken }) => {
    saveStepData({
      listingId,
      useToken,
    });
    try {
      setIsCreatingBooking(true);
      const {
        data: { results: newBooking },
      } = await api.post('/bookings/request', {
        listing: listingId,
        useToken,
        start,
        end,
        ...guests,
      });
      if (newBooking._id) {
        goToNextStep();
      }
    } catch (err) {
      console.log(err); // TO DO handle error
    } finally {
      setIsCreatingBooking(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <BookingBackButton />
        <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_accomodation_step_title')}</span>
        </h1>
        <Progress progress={currentStepIndex + 1} total={steps.length} />
        <div className="mt-6 flex justify-between gap-2 flex-nowrap">
          <div className="border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center">
            <span className="mr-1">📆</span>
            <span>
              {daysjs(dates.data.startDate).format('MMM DD')} -{' '}
              {daysjs(dates.data.endDate).format('MMM DD')}
            </span>
          </div>
          <div className="flex-1 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center">
            <span className="mr-1">👨‍👩‍👦</span>
            <span>{`${totalGuests} ${__(
              'booking_accomodation_step_guest',
            )}`}</span>
          </div>
        </div>
        <div className="mt-16">
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
