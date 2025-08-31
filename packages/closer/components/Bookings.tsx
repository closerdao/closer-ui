import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { BOOKINGS_PER_PAGE, MAX_BOOKINGS_TO_FETCH } from '../constants';
import { usePlatform } from '../contexts/platform';
import BookingListPreview from './BookingListPreview/BookingListPreview';
import Pagination from './Pagination';
import { Button, Heading, Spinner } from './ui';
import { BookingConfig } from '@/types/api';

interface Props {
  filter: any;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  bookingConfig?: BookingConfig;
}

const MAX_USERS_TO_FETCH = 2000;

const Bookings = ({ filter, page, setPage, bookingConfig }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const bookings = platform.booking.find(filter);
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });

  const eventsFilter = bookings && {
    where: {
      _id: {
        $in: bookings.map((booking: any) => booking.get('eventId')),
      },
    },
  };
  const volunteerFilter = bookings && {
    where: {
      _id: {
        $in: bookings.map((booking: any) => booking.get('volunteerId')),
      },
    },
  };
  const listingFilter = bookings && {
    where: {
      _id: {
        $in: bookings.map((booking: any) => booking.get('listing')),
      },
    },
  };

  const error = bookings && bookings.get('error');

  const allBookings = platform.booking.find({
    where: filter?.where,
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
          platform.user.get({ limit: MAX_USERS_TO_FETCH }),
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
      <section>
        {loading ? (
          <div className="my-16 flex items-center gap-2">
            <Spinner /> {t('generic_loading')}
          </div>
        ) : (
          <div className="columns mt-8">
            <div className="flex flex-start items-center border-b pb-4">
              <Heading level={2} className="mr-4 whitespace-nowrap">
                {allBookings ? allBookings.size : 0}{' '}
                {bookings && bookings.count() === 1
                  ? t('booking_requests_result')
                  : t('booking_requests_results')}
              </Heading>

              {bookings && (
                <Button
                  className=" text-background"
                  onClick={() => {
                    const headers = [
                      { label: 'ID', key: 'id' },
                      { label: 'Name', key: 'name' },
                      { label: 'Listing', key: 'listing' },
                      { label: 'Event', key: 'event' },
                      { label: 'Guests', key: 'guests' },
                      { label: 'Volunteer', key: 'volunteer' },
                      { label: 'Arrival', key: 'arrival' },
                      { label: 'Pickup', key: 'pickup' },
                      { label: 'Total', key: 'total' },
                    ];
                    const data = bookings
                      .map((booking: any) => {
                        const user = platform.user.findOne(
                          booking.get('createdBy'),
                        );
                        const listing = platform.listing.findOne(
                          booking.get('listing'),
                        );
                        const bookingEvent = platform.event.findOne(
                          booking.get('eventId'),
                        );

                        return {
                          id: booking.get('_id'),
                          name: user?.get('screenname'),
                          listing: listing?.get('name'),
                          event: bookingEvent?.get('name'),
                          guests: booking.get('adults'),
                          volunteer: booking.get('volunteerId'),
                          arrival: booking.get('start'),
                          pickup: booking.get('doesNeedPickup'),
                          total: booking.getIn(['total', 'val']),
                        };
                      })
                      .toJS();

                    const csvContent = [
                      headers.map((h) => h.label).join(','),
                      ...data.map((row: Record<string, string | number>) =>
                        Object.values(row).join(','),
                      ),
                    ].join('\n');

                    const blob = new Blob([csvContent], {
                      type: 'text/csv;charset=utf-8;',
                    });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `bookings-${dayjs().format(
                      'YYYY-MM-DD.HH:mm',
                    )}.csv`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                  }}
                >
                  {t('generic_export_csv')}
                </Button>
              )}
            </div>
            <div className="bookings-list mt-8 flex flex-wrap gap-4">
              {!bookings || bookings.count() === 0 ? (
                <p className="mt-4">{t('no_bookings')}</p>
              ) : (
                bookings.map((booking: any) => {
                  const listing = platform.listing.findOne(
                    booking.get('listing'),
                  );
                  const listingName = listing
                    ? listing.get('name')
                    : t('no_listing_type');

                  const user =
                    allUsers &&
                    allUsers
                      .toJS()
                      .find(
                        (user: any) => user._id === booking.get('createdBy'),
                      );

                  // Check if there's a paidBy field and fetch payer information
                  const paidBy = booking.get('paidBy');
                  const payer =
                    paidBy &&
                    allUsers &&
                    allUsers.toJS().find((user: any) => user._id === paidBy);

                  const currentEvent = platform.event.findOne(
                    booking.get('eventId'),
                  );

                  const currentVolunteer = platform.volunteer.findOne(
                    booking.get('volunteerId'),
                  );
                  let link;
                  if (currentEvent) {
                    link =
                      currentEvent && `/events/${currentEvent.get('slug')}`;
                  }
                  if (currentVolunteer) {
                    link =
                      currentVolunteer &&
                      `/volunteer/${currentVolunteer.get('slug')}`;
                  }

                  // Use payer information if available, otherwise fall back to creator
                  const userToShow = payer || user;

                  return (
                    <BookingListPreview
                      isAdmin={true}
                      key={booking.get('_id')}
                      booking={platform.booking.findOne(booking.get('_id'))}
                      listingName={listingName}
                      isPrivate={listing && listing.get('private')}
                      isHourly={
                        listing && listing.get('priceDuration') === 'hour'
                      }
                      userInfo={
                        userToShow && {
                          name: userToShow.screenname,
                          photo: userToShow.photo,
                          diet: userToShow.preferences?.diet,
                          email: userToShow.email,
                        }
                      }
                      eventName={currentEvent && currentEvent.get('name')}
                      eventChatLink={currentEvent && currentEvent.get('chatLink')}
                      volunteerName={
                        currentVolunteer && currentVolunteer.get('name')
                      }
                      link={link}
                      bookingConfig={bookingConfig}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

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
    </div>
  );
};

export default Bookings;
