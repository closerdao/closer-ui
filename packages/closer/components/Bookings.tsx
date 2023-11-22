import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { BOOKINGS_PER_PAGE, MAX_BOOKINGS_TO_FETCH } from '../constants';
import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import BookingListPreview from './BookingListPreview/BookingListPreview';
import Pagination from './Pagination';
import { Heading, Spinner } from './ui';

interface Props {
  filter: any;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  isPagination?: boolean;
}
const Bookings = ({ filter, page, setPage, isPagination }: Props) => {
  const { platform }: any = usePlatform();

  const bookings = platform.booking.find(filter);
  const eventsFilter = bookings && { where: {
    _id: {
      $in: bookings.map((booking: any) => booking.get('eventId')),
    },
  } };
  const volunteerFilter = bookings && { where: {
    _id: {
      $in: bookings.map((booking: any) => booking.get('volunteerId')),
    },
  } };
  const listingFilter = bookings && { where: {
    _id: {
      $in: bookings.map((booking: any) => booking.get('listing')),
    },
  } };
  const userFilter = bookings && { where: {
    _id: {
      $in: bookings.map((booking: any) => booking.get('createdBy')),
    },
  } };
  const error = bookings && bookings.get('error');


  const allBookings = platform.booking.find({
    where: filter.where,
    limit: MAX_BOOKINGS_TO_FETCH,
  });

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      platform.booking.get(filter);
      platform.booking.get({
        where: filter.where,
        limit: MAX_BOOKINGS_TO_FETCH,
      }),
      setLoading(true);
      if (bookings) {
        await Promise.all([
          platform.event.get(eventsFilter),
          platform.volunteer.get(volunteerFilter),
          platform.listing.get(listingFilter),
          platform.user.get(userFilter),
        ]);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter) {
      loadData();
    }
  }, [filter, page, bookings]);

  if (error) {
    return <div className="validation-error">{JSON.stringify(error)}</div>;
  }

  return (
    <div>
      {isPagination && (
        <div className="my-10">
          <Pagination
            loadPage={(page: number) => {
              setPage(page);
            }}
            page={page}
            limit={BOOKINGS_PER_PAGE}
            total={allBookings && allBookings.size}
          />
        </div>
      )}

      <section className=" min-h-[100vh]">
        {loading ? (
          <div className="my-16 flex items-center gap-2">
            <Spinner /> {__('generic_loading')}
          </div>
        ) : (
          <div className="columns mt-8">
            <Heading level={2} className="border-b pb-4">
              {allBookings ? allBookings.size : 0}{' '}
              {bookings && bookings.count() === 1
                ? __('booking_requests_result')
                : __('booking_requests_results')}
            </Heading>
            <div className="bookings-list mt-8 flex flex-wrap gap-4">
              {!bookings || bookings.count() === 0 ? (
                <p className="mt-4">{__('no_bookings')}</p>
              ) : (
                bookings.map((booking: any) => {
                  const listing = platform.listing.findOne(booking.get('listing'));
                  const listingName = listing
                    ? listing.get('name')
                    : __('no_listing_type');
                  const user = platform.user.findOne(booking.get('createdBy'));
                  const currentEvent = platform.event.findOne(booking.get('eventId'));

                  const currentVolunteer = platform.volunteer.findOne(booking.get('volunteerId'));
                  let link;
                  if (currentEvent) {
                    link = currentEvent && `/events/${currentEvent.slug}`;
                  }
                  if (currentVolunteer) {
                    link =
                      currentVolunteer && `/volunteer/${currentVolunteer.slug}`;
                  }

                  return (
                    <BookingListPreview
                      key={booking.get('_id')}
                      booking={platform.booking.findOne(booking.get('_id'))}
                      listingName={listingName}
                      userInfo={user && {
                        name: user.get('screenname'),
                        photo: user.get('photo')
                      }}
                      eventName={currentEvent && currentEvent.get('name')}
                      volunteerName={currentVolunteer && currentVolunteer.get('name')}
                      link={link}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>
      {isPagination && (
        <div className="my-10">
          <Pagination
            loadPage={(page: number) => {
              setPage(page);
            }}
            page={page}
            limit={BOOKINGS_PER_PAGE}
            total={allBookings && allBookings.size}
          />
        </div>
      )}
    </div>
  );
};

export default Bookings;
