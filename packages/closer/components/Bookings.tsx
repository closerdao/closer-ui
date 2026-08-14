import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { BOOKINGS_PER_PAGE, MAX_BOOKINGS_TO_FETCH, MAX_LISTINGS_TO_FETCH } from '../constants';
import { usePlatform } from '../contexts/platform';
import { useAuth } from '../contexts/auth';
import { Listing } from '../types';
import BookingActionsDropdown from './BookingActionsDropdown';
import BookingListPreview from './BookingListPreview/BookingListPreview';
import Pagination from './Pagination';
import { Heading, Spinner } from './ui';
import { BookingConfig } from '../types/api';
import {
  getBookingAnswers,
  getBookingListingDisplayName,
  getBookingListingEmbedded,
  getBookingListingRefId,
} from '../utils/booking.helpers';
  getBookingCoGuestIds,
  isBookingCoGuest,
} from '../utils/bookingCoGuests.helpers';
import { csvCell } from '../utils/csv';

interface Props {
  filter: any;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  bookingConfig?: BookingConfig;
  hideExportCsv?: boolean;
  previewAsAdmin?: boolean;
  bookingDetailHrefPrefix?: string;
}

const MAX_USERS_TO_FETCH = 2000;

const Bookings = ({
  filter,
  page,
  setPage,
  bookingConfig,
  hideExportCsv = false,
  previewAsAdmin = true,
  bookingDetailHrefPrefix,
}: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const currentUserId = user?._id;

  const isSpaceHost = user?.roles?.includes('space-host');

  const bookings = platform.booking.find(filter);
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });
  const listingsData = platform.listing.find({
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  });

  const listingOptions = useMemo(() => {
    if (!listingsData) return [];
    return listingsData.toJS().map((listing: Listing) => ({
      value: listing._id,
      label: listing.name,
    }));
  }, [listingsData]);

  const eventIds =
    bookings &&
    bookings.map((b: any) => b.get('eventId')).filter(Boolean).toJS();
  const volunteerIds =
    bookings &&
    bookings.map((b: any) => b.get('volunteerId')).filter(Boolean).toJS();
  const listingIds =
    bookings &&
    bookings
      .map((b: any) => getBookingListingRefId(b.get('listing')))
      .filter((id: string | null) => id != null && id !== '')
      .toJS();
  const eventsFilter =
    eventIds?.length > 0 && { where: { _id: { $in: eventIds } } };
  const volunteerFilter =
    volunteerIds?.length > 0 && { where: { _id: { $in: volunteerIds } } };
  const listingFilter =
    listingIds?.length > 0 && { where: { _id: { $in: listingIds } } };

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
      });
      setLoading(true);
      if (bookings) {
        await Promise.all([
          ...(eventsFilter ? [platform.event.get(eventsFilter)] : []),
          ...(volunteerFilter ? [platform.volunteer.get(volunteerFilter)] : []),
          ...(listingFilter ? [platform.listing.get(listingFilter)] : []),
          platform.listing.get({ where: {}, limit: MAX_LISTINGS_TO_FETCH }),
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

  const handleExportCsv = useCallback(() => {
    if (!bookings) return;

    const headers = [
      { label: 'ID', key: 'id' },
      { label: 'Name', key: 'name' },
      { label: 'Listing', key: 'listing' },
      { label: 'Event', key: 'event' },
      { label: 'Guests', key: 'guests' },
      { label: 'Volunteer', key: 'volunteer' },
      { label: 'Arrival', key: 'arrival' },
      ...(bookingConfig?.pickUpEnabled
        ? [{ label: 'Pickup', key: 'pickup' }]
        : []),
      { label: 'Total', key: 'total' },
      { label: 'Questionnaire', key: 'questionnaire' },
    ];
    const data = bookings
      .map((booking: any) => {
        const user = platform.user.findOne(booking.get('createdBy'));
        const listingRef = booking.get('listing');
        const listingId = getBookingListingRefId(listingRef);
        const listing = listingId
          ? platform.listing.findOne(listingId)
          : null;
        const bookingEvent = platform.event.findOne(booking.get('eventId'));

        return {
          id: booking.get('_id'),
          name: user?.get('screenname'),
          listing:
            listing?.get('name') ??
            getBookingListingDisplayName(listingRef, listing, ''),
          event: bookingEvent?.get('name'),
          guests: booking.get('adults'),
          volunteer: booking.get('volunteerId'),
          arrival: booking.get('start'),
          ...(bookingConfig?.pickUpEnabled
            ? { pickup: booking.get('doesNeedPickup') }
            : {}),
          total:
            booking.getIn(['total', 'val']) ??
            booking.getIn(['priceLock', 'total', 'val']) ??
            booking.getIn(['fiatTarget', 'val']),
          questionnaire: getBookingAnswers(
            booking.get('fields')?.toJS?.() ?? booking.get('fields'),
          )
            .map(({ question, answer }) => `${question}: ${answer}`)
            .join(' | '),
        };
      })
      .toJS();

    const csvContent = [
      headers.map((h) => csvCell(h.label)).join(','),
      ...data.map((row: Record<string, string | number>) =>
        headers.map((h) => csvCell(row[h.key])).join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${dayjs().format('YYYY-MM-DD.HH:mm')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [bookings, platform, bookingConfig]);

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
          <div className="columns">
            <div className="flex flex-start items-center border-b pb-4">
              <Heading level={2} className="mr-4 whitespace-nowrap">
                {allBookings ? allBookings.size : 0}{' '}
                {bookings && bookings.count() === 1
                  ? t('booking_requests_result')
                  : t('booking_requests_results')}
              </Heading>

              {bookings && (!hideExportCsv || isSpaceHost) && (
                <div className="ml-auto">
                  <BookingActionsDropdown
                    listingOptions={listingOptions}
                    onExportCsv={handleExportCsv}
                    showExportCsv={!hideExportCsv}
                    showCreateBooking={isSpaceHost}
                  />
                </div>
              )}
            </div>
            <div className="bookings-list mt-8 grid grid-cols-1 justify-items-start gap-4 md:grid-cols-2">
              {!bookings || bookings.count() === 0 ? (
                <p className="mt-4">{t('no_bookings')}</p>
              ) : (
                bookings.map((booking: any) => {
                  const listingRef = booking.get('listing');
                  const listingId = getBookingListingRefId(listingRef);
                  const listing = listingId
                    ? platform.listing.findOne(listingId)
                    : null;
                  const embedded = getBookingListingEmbedded(listingRef);
                  const listingName = getBookingListingDisplayName(
                    listingRef,
                    listing,
                    t('no_listing_type'),
                  );

                  const user =
                    allUsers &&
                    allUsers
                      .toJS()
                      .find(
                        (user: any) => user._id === booking.get('createdBy'),
                      );

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

                  const userToShow = payer || user;

                  const guests =
                    allUsers &&
                    allUsers.toJS().filter((listedUser: any) =>
                      getBookingCoGuestIds({
                        createdBy: booking.get('createdBy'),
                        visibleBy: booking.get('visibleBy'),
                      }).includes(listedUser._id),
                    );

                  const isCoGuestView = isBookingCoGuest(
                    {
                      createdBy: booking.get('createdBy'),
                      paidBy,
                      visibleBy: booking.get('visibleBy'),
                    },
                    currentUserId,
                  );

                  const isPrivateListing =
                    (listing && listing.get('private')) ?? embedded.private;
                  const isHourlyListing =
                    (listing && listing.get('priceDuration') === 'hour') ||
                    embedded.priceDuration === 'hour';

                  return (
                    <BookingListPreview
                      isAdmin={previewAsAdmin}
                      key={booking.get('_id')}
                      booking={platform.booking.findOne(booking.get('_id'))}
                      listingName={listingName}
                      isPrivate={isPrivateListing}
                      isHourly={isHourlyListing}
                      userInfo={
                        userToShow && {
                          name: userToShow.screenname,
                          photo: userToShow.photo,
                          diet: userToShow.preferences?.diet,
                          email: userToShow.email,
                        }
                      }
                      guestInfo={guests?.map((guest: any) => ({
                        name: guest.screenname,
                        photo: guest.photo,
                        id: guest._id,
                      }))}
                      isCoGuestView={isCoGuestView}
                      eventName={currentEvent && currentEvent.get('name')}
                      eventChatLink={currentEvent && currentEvent.get('chatLink')}
                      volunteerName={
                        currentVolunteer && currentVolunteer.get('name')
                      }
                      link={link}
                      bookingConfig={bookingConfig}
                      bookingDetailHrefPrefix={bookingDetailHrefPrefix}
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
