import { useEffect, useState } from 'react';

import { usePlatform } from '../contexts/platform';
import api from '../utils/api';
import { __ } from '../utils/helpers';
import BookingListPreview from './BookingListPreview';
import { Heading, Spinner } from './ui';

const Bookings = ({ filter }) => {
  const { platform } = usePlatform();
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState();

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.booking.get(filter),
        platform.listing.get(),
        platform.user.get(),
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

  useEffect(() => {
    (async () => {
      const users = await api.get('/user?limit=500');
      setAllUsers(users.data.results);
    })();
  }, []);

  const bookings = platform.booking.find(filter);

  const error = bookings && bookings.get('error');
  const listings = platform.listing.find();

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
                const listing = listings.find(
                  (listing) => listing.get('_id') === listingId,
                );
                const listingName = listing
                  ? listing.get('name')
                  : __('no_listing_type');

                const userId = booking.get('createdBy');
                const user =
                  allUsers && allUsers.find((user) => user._id === userId);

                const userInfo = user && {
                  name: user.screenname,
                  photo: user.photo,
                  email: user.email,
                  phone: user.phone,
                  diet: user?.preferences?.diet,
                };

                return (
                  <BookingListPreview
                    key={booking.get('_id')}
                    booking={platform.booking.findOne(booking.get('_id'))}
                    listingName={listingName}
                    filter={filter}
                    userInfo={userInfo}
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
