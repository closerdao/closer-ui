import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
  MAX_USERS_TO_FETCH,
  paidStatuses,
} from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { getDateRange } from '../../utils/dashboard.helpers';
import UserMetricsIcon from '../icons/UserMetricsIcon';
import { Heading, Spinner } from '../ui';
import StackedBarChart from '../ui/Charts/StackedBarChart';

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

const DashboardMetrics = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const { TIME_ZONE } = useConfig();
  // const { getTokenSalesForDateRange, isBlockchainLoading } = useTokenSales();

  const [isLoading, setIsLoading] = useState(false);
  const [userFilter, setUserFilter] = useState<any>(null);
  const [bookingsFilter, setBookingsFilter] = useState<any>(null);
  const [start, setStart] = useState<Date | string>('');
  const [end, setEnd] = useState<Date | string>('');

  const tokenSalesFilter = {
    where: {},
    limit: MAX_BOOKINGS_TO_FETCH,
  };
  const newUsers = platform.user.find(userFilter);
  const bookings = platform.booking.find(bookingsFilter);
  const tokenSales = platform.metrics.findTokenSales('metrics');

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.user.get(userFilter),
        platform.booking.get(bookingsFilter),
        platform.metrics.getTokenSales(tokenSalesFilter),
      ]);
    } catch (err) {
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

    setUserFilter({
      ...userFilter,
      where: {
        $and: [{ created: { $lte: end } }, { created: { $gte: start } }],
      },
      limit: MAX_USERS_TO_FETCH,
    });
    setBookingsFilter({
      ...bookingsFilter,
      where: {
        status: {
          $in: paidStatuses,
        },
        $and: [{ start: { $lte: end } }, { end: { $gte: start } }],
      },
      limit: MAX_BOOKINGS_TO_FETCH,
    });
  }, [timeFrame, fromDate, toDate]);

  useEffect(() => {
    if (userFilter) {
      loadData();
    }
  }, [userFilter]);

  const getMetricsData = () => {
    const data: any[] = [];

    const numWalletsConnected = newUsers.filter((user: any) => {
      const walletConnectedAt = user.get('actions').get('wallet-connected');

      if (
        walletConnectedAt &&
        dayjs(walletConnectedAt).isBefore(end) &&
        dayjs(walletConnectedAt).isAfter(start)
      ) {
        return true;
      }

      return false;
    }).size;

    const numAdminBookings = bookings.filter((booking: any) => {
      return booking.has('adminBookingReason');
    }).size;

    const numEventAttendees = bookings
      .map((booking: any) => {
        return booking.has('eventId') ? booking.get('adults') : 0;
      })
      .reduce((acc: number, val: number) => acc + val, 0);

    const numMembers = newUsers.filter((user: any) => {
      user.get('roles').includes('member');
    }).size;

    const timePeriodTokenSales = tokenSales.filter((sale: any) => {
      const saleDate = new Date(sale.get('created'));
      const startDate = new Date(start);
      const endDate = new Date(end);

      return saleDate >= startDate && saleDate <= endDate;
    });
    const timePeriodTokenRevenue = timePeriodTokenSales.reduce(
      (acc: number, curr: any) => {
        return Number(acc) + Number(curr.get('value'));
      },
      0,
    );

    data.push(
      {
        name: 'Accounts created',
        amount: newUsers.size,
      },
      {
        name: 'Wallets connected',
        amount: numWalletsConnected,
      },
      {
        name: 'Bookings made',
        amount: bookings.size,
      },
      {
        name: 'Admin bookings',
        amount: numAdminBookings,
      },
      {
        name: 'Tokens sold',
        amount: Number(timePeriodTokenRevenue?.toFixed(1)),
      },
      {
        name: 'Event participants',
        amount: numEventAttendees,
      },
    );
    return data;
  };

  const metricsData = newUsers && bookings && tokenSales && getMetricsData();

  return (
    <section className="bg-white rounded-md p-6 flex flex-col gap-6">
      <Heading level={3} className="uppercase text-md flex gap-3">
        <UserMetricsIcon /> {t('dashboard_metrics')}
      </Heading>
      <div
        className=" h-[400px] 
      "
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <StackedBarChart layout="vertical" data={metricsData} />
        )}
      </div>
    </section>
  );
};

export default DashboardMetrics;
