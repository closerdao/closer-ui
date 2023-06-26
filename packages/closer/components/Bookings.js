import { useEffect, useState } from 'react';

import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import BookingListPreview from './BookingListPreview';
import { Heading, Spinner } from './ui';

const Bookings = ({ filter }) => {
  const { platform } = usePlatform();
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([platform.booking.get(filter), platform.listing.get()]);
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

  const bookings = platform.booking.find(filter);

  const error = bookings && bookings.get('error');
  const listings = platform.listing.find();

  if (error) {
    return <div className="validation-error">{JSON.stringify(error)}</div>;
  }

  return (
    <>
      {loading ? (
        <p className="my-16 flex items-center gap-2">
          <Spinner /> {__('generic_loading')}
        </p>
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
                const listing = listings.find(
                  (listing) => listing.get('_id') === listingId,
                );
                const listingName = listing
                  ? listing.get('name')
                  : __('no_listing_type');

                return (
                  <BookingListPreview
                    key={booking.get('_id')}
                    booking={platform.booking.findOne(booking.get('_id'))}
                    listingName={listingName}
                    filter={filter}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Bookings;
