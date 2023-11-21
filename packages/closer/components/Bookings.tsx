import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { BOOKINGS_PER_PAGE, MAX_BOOKINGS_TO_FETCH } from '../constants';
import { User } from '../contexts/auth/types';
import { usePlatform } from '../contexts/platform';
import { Event } from '../types';
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

  const eventsFilter = {
    where: {},
  };

  const events = platform.event.find(eventsFilter);
  const volunteer = platform.volunteer.find();
  const bookings = platform.booking.find(filter);
  const error = bookings && bookings.get('error');
  const listings = platform.listing.find();
  const allUsers = platform.user.find({ limit: MAX_BOOKINGS_TO_FETCH });

  const allBookings = platform.booking.find({
    where: filter.where,
    limit: MAX_BOOKINGS_TO_FETCH,
  });

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.event.get(eventsFilter),
        platform.volunteer.get(),
        platform.booking.get(filter),
        platform.booking.get({
          where: filter.where,
          limit: MAX_BOOKINGS_TO_FETCH,
        }),
        platform.listing.get(),
        platform.user.get({ limit: MAX_BOOKINGS_TO_FETCH }),
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
  }, [filter, page]);

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
                  const listingId = booking.get('listing');
                  const listing = listings.find(
                    (listing: any) => listing.get('_id') === listingId,
                  );
                  const listingName = listing
                    ? listing.get('name')
                    : __('no_listing_type');
                  const userId = booking.get('createdBy');
                  const user =
                    allUsers &&
                    allUsers.toJS().find((user: User) => user._id === userId);
                  const userInfo = user && {
                    name: user.screenname,
                    photo: user.photo,
                  };
                  const currentEvent = events?.toJS()?.find((event: Event) => {
                    return event._id === booking.get('eventId');
                  });
                  const eventName = currentEvent && currentEvent.name;

                  const currentVolunteer = volunteer
                    ?.toJS()
                    ?.find((v: Event) => {
                      return v._id === booking.get('volunteerId');
                    });
                  const volunteerName =
                    currentVolunteer && currentVolunteer.name;
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
                      userInfo={userInfo}
                      eventName={eventName || null}
                      volunteerName={volunteerName || null}
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
