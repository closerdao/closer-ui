import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, Heading, Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import {
  DateRange,
  generateBookingFilter,
} from '../../../../utils/performance.utils';
import FunnelBar from './FunnelBar';

interface BookingStats {
  openCount: number;
  confirmedCount: number;
  pendingCount: number;
  paidCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  totalCount: number;
}
interface Platform {
  booking: {
    find: (filter: any) => { toJS: () => any[] };
    get: (filter: any) => Promise<any>;
    findCount: (filter: any) => number;
    getCount: (filter: any) => Promise<any>;
  };
}
const StaysFunnel = ({ dateRange }: { dateRange: DateRange }) => {
  const { platform } = usePlatform() as { platform: Platform };
  const t = useTranslations();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const filters = useMemo(
    () => ({
      openBookingsFilter: generateBookingFilter(dateRange, {
        status: 'open',
      }),
      confirmedBookingsFilter: generateBookingFilter(dateRange, {
        status: 'confirmed',
      }),
      pendingBookingsFilter: generateBookingFilter(dateRange, {
        status: 'pending',
      }),
      paidBookingsFilter: generateBookingFilter(dateRange, {
        status: 'paid',
      }),
      checkedInBookingsFilter: generateBookingFilter(dateRange, {
        status: 'checked-in',
      }),
      checkedOutBookingsFilter: generateBookingFilter(dateRange, {
        status: 'checked-out',
      }),
    }),
    [dateRange],
  );

  const bookingStats = useMemo<BookingStats>(() => {
    const openBookings =
      platform.booking.findCount(filters.openBookingsFilter) || 0;
    const confirmedBookings =
      platform.booking.findCount(filters.confirmedBookingsFilter) || 0;
    const pendingBookings =
      platform.booking.findCount(filters.pendingBookingsFilter) || 0;
    const paidBookings =
      platform.booking.findCount(filters.paidBookingsFilter) || 0;
    const checkedInBookings =
      platform.booking.findCount(filters.checkedInBookingsFilter) || 0;
    const checkedOutBookings =
      platform.booking.findCount(filters.checkedOutBookingsFilter) || 0;

    const openCount = openBookings || 0;
    const confirmedCount = confirmedBookings || 0;
    const pendingCount = pendingBookings || 0;
    const paidCount = paidBookings || 0;
    const checkedInCount = checkedInBookings || 0;
    const checkedOutCount = checkedOutBookings || 0;

    return {
      openCount,
      confirmedCount,
      pendingCount,
      paidCount,
      checkedInCount,
      checkedOutCount,
      totalCount:
        openCount +
        confirmedCount +
        pendingCount +
        paidCount +
        checkedInCount +
        checkedOutCount,
    };
  }, [platform, filters]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.booking.getCount(filters.openBookingsFilter),
        platform.booking.getCount(filters.confirmedBookingsFilter),
        platform.booking.getCount(filters.pendingBookingsFilter),
        platform.booking.getCount(filters.paidBookingsFilter),
        platform.booking.getCount(filters.checkedInBookingsFilter),
        platform.booking.getCount(filters.checkedOutBookingsFilter),
      ]);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelStats = useMemo(() => {
    const total = Math.max(
      bookingStats.openCount,
      bookingStats.confirmedCount,
      bookingStats.pendingCount,
      bookingStats.paidCount,
      bookingStats.checkedInCount,
      bookingStats.checkedOutCount,
      1,
    );
    const calculateStats = (count: number) => ({
      count,
      percentage: Math.round((count / total) * 100),
    });

    return {
      open: calculateStats(bookingStats.openCount),
      confirmed: calculateStats(bookingStats.confirmedCount),
      pending: calculateStats(bookingStats.pendingCount),
      paid: calculateStats(bookingStats.paidCount),
      checkedIn: calculateStats(bookingStats.checkedInCount),
      checkedOut: calculateStats(bookingStats.checkedOutCount),
      conversionRate: {
        count: bookingStats.paidCount,
        percentage: Number(
          ((bookingStats.paidCount / bookingStats.openCount) * 100).toFixed(2),
        ),
      },
    };
  }, [bookingStats]);
  return (
    <section className="w-full md:w-1/3 min-h-fit md:min-h-[600px]">
      <Card className="h-full flex flex-col">
        <Heading level={2}>{t('dashboard_performance_stays_funnel')}</Heading>
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto ">
            <div className="border-2 rounded-lg space-y-4 p-2 pb-4">
              <Heading level={3}>
                {t('dashboard_performance_conversion_rate')}
              </Heading>
              <FunnelBar
                label="Paid / open bookings"
                stats={funnelStats.conversionRate}
                color="bg-accent"
              />
            </div>
            <FunnelBar
              label="Open"
              stats={funnelStats.open}
              color="bg-accent"
            />
            <FunnelBar
              label="Confirmed"
              stats={funnelStats.confirmed}
              color="bg-accent"
            />
            <FunnelBar
              label="Pending"
              stats={funnelStats.pending}
              color="bg-accent"
            />
            <FunnelBar
              label="Paid"
              stats={funnelStats.paid}
              color="bg-accent"
            />
            <FunnelBar
              label="Checked-in"
              stats={funnelStats.checkedIn}
              color="bg-accent"
            />
            <FunnelBar
              label="Checked-out"
              stats={funnelStats.checkedOut}
              color="bg-accent"
            />
          </div>
        )}
      </Card>
    </section>
  );
};

export default StaysFunnel;
