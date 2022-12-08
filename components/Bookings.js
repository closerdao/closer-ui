import { useEffect } from 'react';

import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import BookingListPreview from './BookingListPreview';

const Bookings = ({ filter }) => {
  const { platform } = usePlatform();

  const loadData = async () => {
    await Promise.all([platform.booking.get(filter), platform.listing.get()]);
  };

  useEffect(() => {
    if (filter) {
      loadData();
    }
  }, [filter]);

  const myBookings = platform.booking.find(filter);
  const noBookings = myBookings && myBookings.count() === 0;
  const error = myBookings && myBookings.get('error');
  const listings = platform.listing.find();

  if (error) {
    return <div className="validation-error">{JSON.stringify(error)}</div>;
  }

  if (!myBookings || !listings) {
    return null;
  }

  return (
    <div className="columns mt-8">
      <div className="bookings-list mt-8">
        {noBookings && <p className="mt-4">{__('no_bookings')}</p>}
        {myBookings.map((booking) => {
          const listingId = booking.get('listing');
          const listing = listings.find(
            (listing) => listing.get('_id') === listingId,
          );
          const listingName = listing.get('name');

          return (
            <BookingListPreview
              key={booking.get('_id')}
              booking={platform.booking.findOne(booking.get('_id'))}
              listingName={listingName}
              filter={filter}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Bookings;
