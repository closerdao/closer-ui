import { useEffect, useState } from 'react';

import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import UserPreview from './UserPreview';
import { Heading, Spinner } from './ui';

const MAX_USERS_TO_FETCH = 2000;

const CurrentBooking = ({ leftAfter, arriveBefore }) => {
  const { platform } = usePlatform();

  const filter = {
    where: {
      // status: { $nin: ['open', 'pending'] }, // confirmed and various ways to pay...
      status: { $in: ['paid', 'checked-in', 'checked-out'] }, // confirmed and various ways to pay...
      start: { $lte: arriveBefore },
      end: { $gte: leftAfter },
    },
  };

  // FIXME: pull this out?
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // a filter logic to see who is currently here...
  const isHere = (b) => (b.start < tomorrow) && (b.end > yesterday);
  
  const [loading, setLoading] = useState(false);

  const bookings = platform.booking.find(filter);
  const listings = platform.listing.find();
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });

  const error = bookings && bookings.get('error');

  const booked = bookings ? bookings.map(b => {
    const adults = b.get('adults') ?? 0;
    const children = b.get('children') ?? 0;
    const infants = b.get('infants') ?? 0;
    const start = Date.parse(b.get('start'));
    const end =  Date.parse(b.get('end'));
    const doesNeedPickup = b.get('doesNeedPickup') ?? false;

    const listingId = b.get('listing');
    const listingName = listings?.find(
      (listing) => listing.get('_id') === listingId,
    )?.get('name') || __('no_listing_type');
    console.log(listingName);

    const userId = b.get('createdBy');
    const user =
      allUsers && allUsers.toJS().find((user) => user._id === userId);

    const userInfo = user && {
      name: user.screenname,
      photo: user.photo,
      preferences: user.preferences,
    };
    console.log(userInfo);

    return {
      _id: b.get('_id'),
      start,
      end,
      adults,
      children,
      infants,
      listingName,
      userInfo,
      userId,
      doesNeedPickup,
    }
  }) : [];
  
  const countHere = booked ? booked.filter(isHere).map(b => b.adults + b.children).reduce((a, b) => a + b, 0): 0;
  console.log(`people: ${countHere}`);


  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data...');

      await Promise.all([
        platform.booking.get(filter),
        platform.listing.get(),
        platform.user.get({ limit: MAX_USERS_TO_FETCH }),
      ]);

    } catch (err) {
      console.log('Error loading data...');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leftAfter, arriveBefore]);

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
            {countHere} {__('current_bookings_people_here')}
          </Heading>
          <div className="bookings-list mt-8 flex flex-wrap gap-4">
            {!booked.size ? (
              <p className="mt-4">{__('no_bookings')}</p>
            ) : (
              booked.map((b) => {

                return (
                  <UserPreview
                    key={b._id}
                    booking={b}
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

export default CurrentBooking;
