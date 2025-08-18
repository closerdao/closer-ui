import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BOOKINGS_PER_PAGE, MAX_LISTINGS_TO_FETCH } from '../constants';
import { usePlatform } from '../contexts/platform';
import { cdn } from '../utils/api';
import { priceFormat } from '../utils/helpers';
import Pagination from './Pagination';
import {
  Heading,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui';

const MAX_USERS_TO_FETCH = 2000;

const CurrentBooking = ({ leftAfter, arriveBefore }) => {
  const t = useTranslations();

  const { platform } = usePlatform();

  const [loading, setLoading] = useState(false);
  const [isHerePage, setIsHerePage] = useState(1);
  const [willArrivePage, setWillArrivePage] = useState(1);
  const [justLeftPage, setJustLeftPage] = useState(1);
  const filter = {
    where: {
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
      start: { $lte: arriveBefore },
      end: { $gte: leftAfter },
    },
    limit: MAX_USERS_TO_FETCH,
  };

  const bookings = platform.booking.find(filter);

  const eventsFilter = bookings && {
    where: {
      _id: {
        $in: bookings.map((booking) => booking.get('eventId')).toJS(),
      },
    },
  };
  const volunteerFilter = bookings && {
    where: {
      _id: {
        $in: bookings.map((booking) => booking.get('volunteerId')).toJS(),
      },
    },
  };

  const listings = platform.listing.find({
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  });
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });
  const error = bookings && bookings.get('error');

  const booked =
    bookings && bookings.size > 0
      ? bookings
          .map((b) => {
            console.log('booking=', b.toJS());
            const adults = b.get('adults') ?? 0;
            const children = b.get('children') ?? 0;
            const infants = b.get('infants') ?? 0;
            const start = Date.parse(b.get('start'));
            const end = Date.parse(b.get('end'));
            const doesNeedPickup = b.get('doesNeedPickup') ?? false;
            const doesNeedSeparateBeds = b.get('doesNeedSeparateBeds') ?? false;
            const status = b.get('status') ?? 'unknown';
            const eventId = b.get('eventId');
            const volunteerId = b.get('volunteerId');
            const duration = b.get('duration') ?? 0;

            const listingId = b.get('listing');
            const listing = listings?.find(
              (listing) => listing.get('_id') === listingId,
            );
            const isHourly = listing?.get('priceDuration') === 'hour' ?? false;
            const listingName = listing?.get('name') || t('no_listing_type');
            const isListingPrivate = listing?.get('private') || true;

            const userId = b.get('createdBy');
            const user =
              allUsers && allUsers.find((user) => user.get('_id') === userId);

            const paidBy = b.get('paidBy');
            const payer =
              paidBy &&
              allUsers &&
              allUsers.find((user) => user.get('_id') === paidBy);

            const userToShow = payer || user;

            const userInfo = userToShow && {
              name: userToShow.get('screenname'),
              photo: userToShow.get('photo'),
              preferences: userToShow.get('preferences'),
              email: userToShow.get('email'),
            };

            const rentalFiat = b.get('rentalFiat');
            const utilityFiat = b.get('utilityFiat');
            const foodFiat = b.get('foodFiat');
            const eventFiat = b.get('eventFiat');

            const totalAmount = b.get('total');

            console.log('b.get(total)=', b.get('total'));
            const totalCurrency = rentalFiat?.cur || 'EUR';

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
              doesNeedSeparateBeds,
              status,
              eventId,
              volunteerId,
              isListingPrivate,
              duration,
              isHourly,
              totalAmount,
              totalCurrency,
            };
          })
          .toJS()
      : [];

  const current = new Date();
  const justLeft = booked ? booked.filter((b) => b.end < current) : [];
  const isHere = booked
    ? booked.filter((b) => b.end >= current && b.start <= current)
    : [];
  const willArrive = booked ? booked.filter((b) => b.start > current) : [];

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        platform.booking.get(filter),
        platform.listing.get({
          where: {},
          limit: MAX_LISTINGS_TO_FETCH,
        }),
        platform.user.get({ limit: MAX_USERS_TO_FETCH }),
        platform.event.get(eventsFilter),
        platform.volunteer.get(volunteerFilter),
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

  const formatDate = (date) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  const formatTime = (date) => {
    return dayjs(date).format('HH:mm');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      paid: 'bg-green-100 text-green-800',
      'checked-in': 'bg-blue-100 text-blue-800',
      'checked-out': 'bg-gray-100 text-gray-800',
      confirmed: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-orange-100 text-orange-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  const renderBookingsTable = (bookings, title, count) => (
    <div className="mb-8">
      <Heading level={2} className="border-b pb-4 mb-4">
        {count} {title}
      </Heading>
      {!count ? (
        <p className="mt-4">{t('no_bookings')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Separate Beds</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const currentEvent = platform.event.findOne(b.eventId);
                const currentVolunteer = platform.volunteer.findOne(
                  b.volunteerId,
                );

                return (
                  <TableRow key={b._id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {b.userInfo?.photo && (
                          <img
                            src={`${cdn}${b.userInfo.photo}-profile-sm.jpg`}
                            alt={b.userInfo.name}
                            className="w-6 h-6 rounded-full flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {b.userInfo?.name || 'Unknown'}
                          </div>
                          {b.userInfo?.email && (
                            <div className="text-xs text-gray-500 truncate">
                              {b.userInfo.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <div className="font-medium truncate">
                          {b.listingName}
                        </div>
                        {currentEvent && (
                          <div className="text-xs text-gray-500 truncate">
                            Event: {currentEvent.get('name')}
                          </div>
                        )}
                        {currentVolunteer && (
                          <div className="text-xs text-gray-500 truncate">
                            Volunteer: {currentVolunteer.get('name')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <div>{formatDate(b.start)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <div>{formatDate(b.end)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-center">
                        <div className="font-medium">{b.adults}</div>
                        {(b.children > 0 || b.infants > 0) && (
                          <div className="text-xs text-gray-500">
                            {b.children > 0 && `${b.children}c`}
                            {b.children > 0 && b.infants > 0 && '/'}
                            {b.infants > 0 && `${b.infants}i`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-center">
                        {b.isHourly ? '-' : `${b.duration} nights`}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getStatusBadge(b.status)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-right">
                        {b.totalAmount ? (
                          <div className="font-medium">
                            {priceFormat({
                              val: b.totalAmount?.val || 0,
                              cur: b.totalAmount?.cur || 'EUR',
                            })}
                          </div>
                        ) : (
                          <div className="text-gray-500">Free</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-center">
                        {b.doesNeedPickup ? (
                          <span className="text-red-600">🚗</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-center">
                        {b.doesNeedSeparateBeds ? (
                          <span className="text-blue-600">🛏️</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-center">
                        <a
                          href={`/bookings/${b._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  if (error) {
    return <div className="validation-error">{JSON.stringify(error)}</div>;
  }

  const isLoading = loading || !bookings || !listings || !allUsers;

  return (
    <section className="min-h-[100vh]">
      {isLoading ? (
        <div className="my-16 flex items-center gap-1">
          <Spinner /> {t('generic_loading')}
        </div>
      ) : (
        <div className="space-y-8">
          {renderBookingsTable(
            isHere.slice(
              (isHerePage - 1) * BOOKINGS_PER_PAGE,
              isHerePage * BOOKINGS_PER_PAGE,
            ),
            t('current_bookings_people_here'),
            isHere.length,
          )}

          <div className="my-6">
            <Pagination
              loadPage={(page) => setIsHerePage(page)}
              page={isHerePage}
              limit={BOOKINGS_PER_PAGE}
              total={isHere.length}
            />
          </div>

          {renderBookingsTable(
            willArrive.slice(
              (willArrivePage - 1) * BOOKINGS_PER_PAGE,
              willArrivePage * BOOKINGS_PER_PAGE,
            ),
            t('current_bookings_will_arrive'),
            willArrive.length,
          )}

          <div className="my-6">
            <Pagination
              loadPage={(page) => setWillArrivePage(page)}
              page={willArrivePage}
              limit={BOOKINGS_PER_PAGE}
              total={willArrive.length}
            />
          </div>

          {renderBookingsTable(
            justLeft.slice(
              (justLeftPage - 1) * BOOKINGS_PER_PAGE,
              justLeftPage * BOOKINGS_PER_PAGE,
            ),
            t('current_bookings_just_left'),
            justLeft.length,
          )}

          <div className="my-6">
            <Pagination
              loadPage={(page) => setJustLeftPage(page)}
              page={justLeftPage}
              limit={BOOKINGS_PER_PAGE}
              total={justLeft.length}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default CurrentBooking;
