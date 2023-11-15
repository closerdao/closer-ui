import { useEffect, useState } from 'react';

import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import BookingListPreview from './BookingListPreview/BookingListPreview';
import { Heading, Spinner } from './ui';

const loadTime = new Date();

const MAX_USERS_TO_FETCH = 2000;

const Bookings = ({ filter }) => {
  const { platform } = usePlatform();

  const currentFilter = {
    where: {
      end: { $gte: loadTime },
    },
  };

  const events = platform.event.find(currentFilter);
  const volunteerOpportunities = platform.volunteer.find(currentFilter);
  const bookings = platform.booking.find(filter);
  const error = bookings && bookings.get('error');
  const listings = platform.listing.find();
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.event.get(currentFilter),
        platform.booking.get(filter),
        platform.listing.get(),
        platform.user.get({ limit: MAX_USERS_TO_FETCH }),
        platform.volunteer.get(currentFilter),
      ]);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter) {
      loadData();
    }
  }, [filter]);

  const getLink = (currentEvent, currentVolunteer) => {
    if (currentEvent) {
      return `/events/${currentEvent.slug}`;
    }
    if (currentVolunteer) {
      return `/volunteer/${currentVolunteer.slug}`;
    }
    return null;
  };

  if (error) {
    return <div className="validation-error">{JSON.stringify(error)}</div>;
  }

  return (
    <section className=" min-h-[100vh]">
      {loading ? (
        <div className="my-16 flex items-center gap-2">
          <Spinner /> {__('generic_loading')}
        </div>
      ) : (
        <div className="columns mt-8">
          <Heading level={2} className="border-b pb-4">
            {bookings ? bookings.count().toString() : 0}{' '}
            {bookings && bookings.count() === 1
              ? __('booking_requests_result')
              : __('booking_requests_results')}
          </Heading>
          <div className="bookings-list mt-8 flex flex-wrap gap-4">
            {!bookings || bookings.count() === 0 ? (
              <p className="mt-4">{__('no_bookings')}</p>
            ) : (
              bookings.map((booking) => {
                const listingId = booking.get('listing');

                const currentListing = listings.find(
                  (listing) => listing.get('_id') === listingId,
                );
                const listingName = currentListing
                  ? currentListing.get('name')
                  : __('no_listing_type');

                const userId = booking.get('createdBy');
                const user =
                  allUsers &&
                  allUsers.toJS().find((user) => user._id === userId);

                const userInfo = user && {
                  name: user.screenname,
                  photo: user.photo,
                };

                const currentEvent = events?.toJS()?.find((event) => {
                  return event._id === booking.get('eventId');
                });
                const currentVolunteer = volunteerOpportunities
                  ?.toJS()
                  ?.find((opportunity) => {
                    return opportunity._id === booking.get('volunteerId');
                  });

                const eventName = currentEvent && currentEvent.name;
                const volunteerName = currentVolunteer && currentVolunteer.name;
                const link = getLink(currentEvent, currentVolunteer);

                return (
                  <BookingListPreview
                    key={booking.get('_id')}
                    booking={platform.booking.findOne(booking.get('_id'))}
                    listingName={listingName}
                    filter={filter}
                    userInfo={userInfo}
                    eventName={eventName || null}
                    volunteerName={volunteerName || null}
                    link={link || null}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Bookings;
