import { useCallback, useEffect, useMemo, useState } from 'react';

import { Card, Heading, Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import { generateBookingFilter } from '../../../../utils/performance.utils';
import FunnelBar from './FunnelBar';

interface BookingStats {
  openCount: number;
  confirmedCount: number;
  pendingCount: number;
  paidCount: number;
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

interface StaysFunnelProps {
  timeFrame: string;
  fromDate: string;
  toDate: string;
}

const StaysFunnel = ({ timeFrame, fromDate, toDate }: StaysFunnelProps) => {
  const { platform } = usePlatform() as { platform: Platform };
  const t = useTranslations();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const filters = useMemo(
    () => ({
      openBookingsFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {
          status: 'open',
        },
      }),
      confirmedBookingsFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {
          status: 'confirmed',
        },
      }),
      pendingBookingsFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {
          status: 'pending',
        },
      }),
      paidBookingsFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {
          status: 'paid',
        },
      }),
    }),
    [fromDate, toDate, timeFrame],
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

    const openCount = openBookings || 0;
    const confirmedCount = confirmedBookings || 0;
    const pendingCount = pendingBookings || 0;
    const paidCount = paidBookings || 0;

    return {
      openCount,
      confirmedCount,
      pendingCount,
      paidCount,
      totalCount:
        openCount +
        confirmedCount +
        pendingCount +
        paidCount,
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
      ]);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, timeFrame]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelStats = useMemo(() => {
    const total = Math.max(
      bookingStats.openCount,
      bookingStats.confirmedCount,
      bookingStats.pendingCount,
      bookingStats.paidCount,
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
      conversionRate: {
        count: `${bookingStats.paidCount} / ${bookingStats.openCount}`,
        percentage: Number(
          ((bookingStats.paidCount / bookingStats.openCount) * 100).toFixed(2),
        ) || 0,
      },
    };
  }, [bookingStats]);
  return (
    <section className="w-full md:w-1/3 min-h-fit md:min-h-[600px]">
      <Card className="h-full flex flex-col justify-start">
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
              label="Paid (includes Checked-in & Checked-out)"
              stats={funnelStats.paid}
              color="bg-accent"
            />
          </div>
        )}
      </Card>
    </section>
  );
};

export default StaysFunnel;
