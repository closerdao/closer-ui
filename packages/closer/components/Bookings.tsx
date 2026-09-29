import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { BOOKINGS_PER_PAGE, MAX_LISTINGS_TO_FETCH } from '../constants';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { useHostNotes } from '../hooks/useHostNotes';
import { Listing } from '../types';
import { BookingConfig } from '../types/api';
import type { UnitListing } from '../types/booking';
import {
  getBookingAnswers,
  getBookingListingDisplayName,
  getBookingListingEmbedded,
  getBookingListingRefId,
} from '../utils/booking.helpers';
import {
  getBookingCoGuestIds,
  getBookingsUserIds,
  isBookingCoGuest,
} from '../utils/bookingCoGuests.helpers';
import { csvCell } from '../utils/csv';
import BookingActionsDropdown from './BookingActionsDropdown';
import BookingListPreview from './BookingListPreview/BookingListPreview';
import Pagination from './Pagination';
import { Heading, Spinner } from './ui';

interface Props {
  filter: any;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  bookingConfig?: BookingConfig;
  hideExportCsv?: boolean;
  previewAsAdmin?: boolean;
  bookingDetailHrefPrefix?: string;
}

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
  const canManageBookings = Boolean(
    isSpaceHost || user?.roles?.includes('admin'),
  );

  const bookings = platform.booking.find(filter);
  const { hostNotes } = useHostNotes(
    canManageBookings && bookings
      ? bookings.map((b: any) => b.get('_id')).toJS()
      : undefined,
  );
  const bookingUserIds: string[] = useMemo(
    () => (bookings ? getBookingsUserIds(bookings.toJS()) : []),
    [bookings],
  );
  const usersFilter = useMemo(
    () =>
      bookingUserIds.length > 0
        ? {
            where: { _id: { $in: bookingUserIds } },
            limit: bookingUserIds.length,
          }
        : null,
    [bookingUserIds],
  );
  const areUsersLoaded =
    !usersFilter || platform.user.areLoading(usersFilter) === false;
  const getUser = (id?: string | null) =>
    id ? platform.user.findOne(id)?.toJS() : undefined;
  const unknownGuestName = t('bookings_unknown_guest');
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
    bookings
      .map((b: any) => b.get('eventId'))
      .filter(Boolean)
      .toJS();
  const volunteerIds =
    bookings &&
    bookings
      .map((b: any) => b.get('volunteerId'))
      .filter(Boolean)
      .toJS();
  const listingIds =
    bookings &&
    bookings
      .map((b: any) => getBookingListingRefId(b.get('listing')))
      .filter((id: string | null) => id != null && id !== '')
      .toJS();
  const eventsFilter = eventIds?.length > 0 && {
    where: { _id: { $in: eventIds } },
  };
  const volunteerFilter = volunteerIds?.length > 0 && {
    where: { _id: { $in: volunteerIds } },
  };
  const listingFilter = listingIds?.length > 0 && {
    where: { _id: { $in: listingIds } },
  };

  const error = bookings && bookings.get('error');

  const countFilter = useMemo(() => ({ where: filter?.where }), [filter]);
  const totalBookings: number | undefined =
    platform.booking.findCount(countFilter);

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      platform.booking.get(filter);
      platform.booking.getCount(countFilter);
      setLoading(true);
      if (bookings) {
        await Promise.all([
          ...(eventsFilter ? [platform.event.get(eventsFilter)] : []),
          ...(volunteerFilter ? [platform.volunteer.get(volunteerFilter)] : []),
          ...(listingFilter ? [platform.listing.get(listingFilter)] : []),
          platform.listing.get({ where: {}, limit: MAX_LISTINGS_TO_FETCH }),
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

  useEffect(() => {
    if (usersFilter) {
      platform.user.get(usersFilter);
    }
  }, [usersFilter]);

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
        const listing = listingId ? platform.listing.findOne(listingId) : null;
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
                {totalBookings ?? 0}{' '}
                {totalBookings === 1
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

                  const paidBy = booking.get('paidBy');

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

                  const userToShow =
                    getUser(paidBy) || getUser(booking.get('createdBy'));

                  const guests = getBookingCoGuestIds({
                    createdBy: booking.get('createdBy'),
                    guests: booking.get('guests'),
                  }).map((id) => ({ id, user: getUser(id) }));

                  const isCoGuestView = isBookingCoGuest(
                    {
                      createdBy: booking.get('createdBy'),
                      paidBy,
                      guests: booking.get('guests'),
                    },
                    currentUserId,
                  );

                  const unitListing: UnitListing = {
                    name: listingName,
                    private: Boolean(
                      (listing && listing.get('private')) ?? embedded.private,
                    ),
                    // 0 when unknown: numbers the unit instead of hiding it behind the bare name.
                    quantity:
                      (listing && listing.get('quantity')) ??
                      embedded.quantity ??
                      0,
                  };
                  const isHourlyListing =
                    (listing && listing.get('priceDuration') === 'hour') ||
                    embedded.priceDuration === 'hour';

                  return (
                    <BookingListPreview
                      isAdmin={previewAsAdmin}
                      key={booking.get('_id')}
                      booking={platform.booking.findOne(booking.get('_id'))}
                      listing={unitListing}
                      isHourly={isHourlyListing}
                      userInfo={
                        userToShow
                          ? {
                              name: userToShow.screenname,
                              photo: userToShow.photo,
                              diet: userToShow.preferences?.diet,
                              email: userToShow.email,
                            }
                          : areUsersLoaded
                            ? { name: unknownGuestName }
                            : null
                      }
                      guestInfo={guests.map(({ id, user: guest }) => ({
                        name:
                          guest?.screenname ??
                          (areUsersLoaded ? unknownGuestName : ''),
                        photo: guest?.photo,
                        id,
                      }))}
                      isUserInfoLoading={!areUsersLoaded}
                      isCoGuestView={isCoGuestView}
                      eventName={currentEvent && currentEvent.get('name')}
                      eventChatLink={
                        currentEvent && currentEvent.get('chatLink')
                      }
                      volunteerName={
                        currentVolunteer && currentVolunteer.get('name')
                      }
                      link={link}
                      bookingConfig={bookingConfig}
                      bookingDetailHrefPrefix={bookingDetailHrefPrefix}
                      hostNote={hostNotes[booking.get('_id')]}
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
          total={totalBookings}
        />
      </div>
    </div>
  );
};

export default Bookings;
