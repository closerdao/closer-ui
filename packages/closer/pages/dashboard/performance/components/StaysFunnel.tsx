import { useCallback, useEffect, useMemo, useState } from 'react';

import { Spinner } from '../../../../components/ui';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../../../contexts/platform';
import { parseMessageFromError } from '../../../../utils/common';
import { generateBookingFilter, generatePageViewFilter } from '../../../../utils/performance.utils';

interface BookingStats {
  pageViewCount: number;
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
  metric: {
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
      pageViewFilter: generatePageViewFilter({
        fromDate,
        toDate,
        timeFrame,
        page: 'stay',
      }),
      allBookingsFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {}, // No status filter = all bookings
      }),
      pendingOrBeyondFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {
          status: ['pending', 'confirmed', 'paid', 'checked-in', 'checked-out']
        },
      }),
      confirmedOrBeyondFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {
          status: ['confirmed', 'paid', 'checked-in', 'checked-out']
        },
      }),
      paidOrBeyondFilter: generateBookingFilter({
        fromDate,
        toDate,
        timeFrame,
        options: {
          status: ['paid', 'checked-in', 'checked-out']
        },
      }),
    }),
    [fromDate, toDate, timeFrame],
  );

  const bookingStats = useMemo<BookingStats>(() => {
    const pageViews =
      platform.metric.findCount(filters.pageViewFilter) || 0;
    const allBookings =
      platform.booking.findCount(filters.allBookingsFilter) || 0;
    
    // Dropoff funnel logic - cumulative counts using stored filters
    const pendingOrBeyond = platform.booking.findCount(filters.pendingOrBeyondFilter) || 0;
    const confirmedOrBeyond = platform.booking.findCount(filters.confirmedOrBeyondFilter) || 0;
    const paidOrBeyond = platform.booking.findCount(filters.paidOrBeyondFilter) || 0;

    const pageViewCount = pageViews || 0;
    const totalCount = allBookings || 0;
    const pendingCount = pendingOrBeyond || 0;
    const confirmedCount = confirmedOrBeyond || 0;
    const paidCount = paidOrBeyond || 0;

    return {
      pageViewCount,
      confirmedCount,
      pendingCount,
      paidCount,
      totalCount,
    };
  }, [platform, filters]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.metric.getCount(filters.pageViewFilter),
        platform.booking.getCount(filters.allBookingsFilter),
        platform.booking.getCount(filters.pendingOrBeyondFilter),
        platform.booking.getCount(filters.confirmedOrBeyondFilter),
        platform.booking.getCount(filters.paidOrBeyondFilter),
      ]);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  }, [platform, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const funnelStats = useMemo(() => {
    const maxCount = Math.max(bookingStats.totalCount, 1);
    const calculateStats = (count: number) => ({
      count,
      percentage: Math.round((count / maxCount) * 100),
    });

    return {
      total: calculateStats(bookingStats.totalCount),
      confirmed: calculateStats(bookingStats.confirmedCount),
      pending: calculateStats(bookingStats.pendingCount),
      paid: calculateStats(bookingStats.paidCount),
      conversionRate: {
        count: `${bookingStats.paidCount} / ${bookingStats.totalCount}`,
        percentage: Number(
          ((bookingStats.paidCount / bookingStats.totalCount) * 100).toFixed(2),
        ) || 0,
      },
    };
  }, [bookingStats]);
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t('dashboard_performance_stays_funnel')}
            </h3>
            <p className="text-gray-600 text-sm">{t('dashboard_performance_booking_conversion_funnel')}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Activity Indicator */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">{t('dashboard_performance_page_views')}</span>
                <span className="text-2xl font-bold text-gray-900">
                  {bookingStats.pageViewCount}
                </span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-sm font-medium">{t('dashboard_performance_conversion_rate_label')}</span>
                <span className="text-2xl font-bold text-primary">
                  {funnelStats.conversionRate.percentage}%
                </span>
              </div>
              <div className="text-gray-600 text-xs mt-1">
                {funnelStats.conversionRate.count} {t('dashboard_performance_bookings_converted')}
              </div>
            </div>

            {/* Funnel Steps - Single Card Design */}
            <div className="bg-white/90 rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_total_bookings')}</span>
                  <span className="font-bold">{funnelStats.total.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: '100%' }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_pending_plus')}</span>
                  <span className="font-bold">{funnelStats.pending.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.pending.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_confirmed_plus')}</span>
                  <span className="font-bold">{funnelStats.confirmed.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.confirmed.percentage}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-sm font-medium">{t('dashboard_performance_paid')}</span>
                  <span className="font-bold">{funnelStats.paid.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: `${funnelStats.paid.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaysFunnel;
