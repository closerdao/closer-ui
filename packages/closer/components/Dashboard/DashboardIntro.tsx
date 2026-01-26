import { useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
  MAX_LISTINGS_TO_FETCH,
  MAX_USERS_TO_FETCH,
  paidStatuses,
} from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import {
  getBookedNights,
  getDateRange,
  getDuration,
} from '../../utils/dashboard.helpers';
import { Spinner } from '../ui';

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

const DashboardIntro = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { APP_NAME, TIME_ZONE } = useConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [userFilter, setUserFilter] = useState<any>(null);
  const [bookingFilter, setBookingFilter] = useState<any>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  const tokenSalesFilter = { where: {}, limit: MAX_BOOKINGS_TO_FETCH };
  const listingFilter = { where: {}, limit: MAX_LISTINGS_TO_FETCH };

  const users = platform.user.find(userFilter);
  const bookings = platform.booking.find(bookingFilter);
  const listings = platform.listing.find(listingFilter);
  const tokenSales =
    APP_NAME === 'tdf' ? platform.metrics.findTokenSales('metrics') : null;

  const firstBooking =
    bookings &&
    bookings.find((booking: any) => paidStatuses.includes(booking.get('status')));
  const firstBookingDate = firstBooking && firstBooking.get('start');

  const duration = getDuration(
    timeFrame,
    timeFrame === 'allTime' ? new Date(firstBookingDate) : fromDate,
    toDate,
  );

  const nightlyListings = useMemo(
    () =>
      listings?.filter(
        (listing: any) =>
          !listing.get('priceDuration') ||
          listing.get('priceDuration') === 'night',
      ),
    [listings],
  );

  const nightlyListingsIds =
    nightlyListings && nightlyListings.map((listing: any) => listing.get('_id'));

  const nightlyBookings =
    bookings &&
    nightlyListings &&
    bookings.filter((booking: any) =>
      nightlyListingsIds.includes(booking.get('listing')),
    );

  const { numBookedNights } = getBookedNights({
    nightlyBookings,
    nightlyListings,
    start,
    end,
    duration,
    TIME_ZONE,
    firstBookingDate: timeFrame === 'allTime' ? firstBookingDate : undefined,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.user.get(userFilter),
        platform.booking.get(bookingFilter),
        platform.listing.get(listingFilter),
        APP_NAME === 'tdf'
          ? platform.metrics.getTokenSales(tokenSalesFilter)
          : Promise.resolve(null),
      ]);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { start, end } = getDateRange({
      timeFrame,
      fromDate,
      toDate,
      timeZone: TIME_ZONE,
    });
    setStart(start);
    setEnd(end);

    if (timeFrame === 'allTime') {
      setUserFilter({ where: {}, limit: MAX_USERS_TO_FETCH });
      setBookingFilter({
        where: { status: { $in: paidStatuses } },
        sort_by: 'start',
        limit: MAX_BOOKINGS_TO_FETCH,
      });
    } else {
      setUserFilter({
        where: {
          $and: [{ created: { $lte: end } }, { created: { $gte: start } }],
        },
        limit: MAX_USERS_TO_FETCH,
      });
      setBookingFilter({
        where: {
          status: { $in: paidStatuses },
          $and: [{ start: { $lte: end } }, { end: { $gte: start } }],
        },
        sort_by: 'start',
        limit: MAX_BOOKINGS_TO_FETCH,
      });
    }
  }, [timeFrame, fromDate, toDate]);

  useEffect(() => {
    if (userFilter) {
      loadData();
    }
  }, [userFilter]);

  const getStats = () => {
    if (!users || !bookings) {
      return {
        accountsCreated: 0,
        walletsConnected: 0,
        bookingsMade: 0,
        nightsSpent: 0,
        tokensSold: 0,
        eventParticipants: 0,
      };
    }

    const walletsConnected = users.filter((user: any) => {
      const walletConnectedAt = user.get('actions')?.get('wallet-connected');
      if (timeFrame === 'allTime' && walletConnectedAt) return true;
      if (
        walletConnectedAt &&
        dayjs(walletConnectedAt).isBefore(end) &&
        dayjs(walletConnectedAt).isAfter(start)
      ) {
        return true;
      }
      return false;
    }).size;

    const eventParticipants = bookings
      .map((booking: any) =>
        booking.has('eventId') ? booking.get('adults') || 0 : 0,
      )
      .reduce((acc: number, val: number) => acc + val, 0);

    let tokensSold = 0;
    if (APP_NAME === 'tdf' && tokenSales) {
      const filteredSales =
        timeFrame === 'allTime'
          ? tokenSales
          : tokenSales.filter((sale: any) => {
              const saleDate = new Date(sale.get('created'));
              return saleDate >= (start || 0) && saleDate <= (end || 0);
            });
      tokensSold =
        filteredSales?.reduce(
          (acc: number, sale: any) => acc + Number(sale.get('value') || 0),
          0,
        ) || 0;
    }

    return {
      accountsCreated: users.size,
      walletsConnected,
      bookingsMade: bookings.size,
      nightsSpent: numBookedNights || 0,
      tokensSold: Number(tokensSold.toFixed(0)),
      eventParticipants,
    };
  };

  const stats = getStats();

  const metrics = [
    {
      key: 'accounts',
      value: stats.accountsCreated,
      label: t('dashboard_intro_accounts_created'),
    },
    {
      key: 'wallets',
      value: stats.walletsConnected,
      label: t('dashboard_intro_wallets_connected'),
    },
    {
      key: 'bookings',
      value: stats.bookingsMade,
      label: t('dashboard_intro_bookings_made'),
    },
    {
      key: 'nights',
      value: stats.nightsSpent,
      label: t('dashboard_intro_nights_spent'),
    },
    ...(APP_NAME === 'tdf'
      ? [
          {
            key: 'tokens',
            value: stats.tokensSold,
            label: t('dashboard_intro_tokens_sold'),
          },
        ]
      : []),
    {
      key: 'events',
      value: stats.eventParticipants,
      label: t('dashboard_intro_event_participants'),
    },
  ];

  return (
    <section>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className="bg-accent-light/30 rounded-lg p-3 text-center"
            >
              <div className="text-xl font-bold text-accent">
                {(metric.value || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">{metric.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DashboardIntro;
