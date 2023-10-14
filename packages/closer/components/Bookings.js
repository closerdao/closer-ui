import { useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';

import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import BookingListPreview from './BookingListPreview';
import { Heading, Spinner } from './ui';

const loadTime = new Date();
const MAX_USERS_TO_FETCH = 2000;

const Bookings = ({ filter }) => {
  const { platform } = usePlatform();

  const eventsFilter = {
    where: {
      end: { $gte: loadTime },
    },
  };

  const events = platform.event.find(eventsFilter);
  const bookings = platform.booking.find(filter);
  const error = bookings && bookings.get('error');
  const listings = platform.listing.find();
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.event.get(eventsFilter),
        platform.booking.get(filter),
        platform.listing.get(),
        platform.user.get({ limit: MAX_USERS_TO_FETCH }),
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

  if (error) {
    return <div className="validation-error">{JSON.stringify(error)}</div>;
  }

  // TODO: review headers/fields
  const headers = ['_id', 'created', 'start', 'end', 'status', 'createdBy', 'listing', 'eventId', 'volunteerId', 'adults', 'children', 'infants', 'useTokens'];
  const csvData = bookings ? bookings.toJS() : [];

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
            <CSVLink headers={headers} data={csvData} filename={'bookings.csv'} className="btn btn-primary ml-16" target="_blank">Download CSV</CSVLink>
          </Heading>
          <div className="bookings-list mt-8 flex flex-wrap gap-4">
            {!bookings || bookings.count() === 0 ? (
              <p className="mt-4">{__('no_bookings')}</p>
            ) : (
              bookings.map((booking) => {
                const listingId = booking.get('listing');
                const listing = listings.find(
                  (listing) => listing.get('_id') === listingId,
                );
                const listingName = listing
                  ? listing.get('name')
                  : __('no_listing_type');

                const userId = booking.get('createdBy');
                const user =
                  allUsers && allUsers.toJS().find((user) => user._id === userId);

                const userInfo = user && {
                  name: user.screenname,
                  photo: user.photo,
                };

                const currentEvent = events?.toJS()?.find((event) => {
                  return event._id === booking.get('eventId');
                });

                const eventName = currentEvent && currentEvent.name;

                return (
                  <BookingListPreview
                    key={booking.get('_id')}
                    booking={platform.booking.findOne(booking.get('_id'))}
                    listingName={listingName}
                    filter={filter}
                    userInfo={userInfo}
                    eventName={eventName || null}
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
