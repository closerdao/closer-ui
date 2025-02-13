import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { List } from 'immutable';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
  MAX_LISTINGS_TO_FETCH,
  paidStatuses,
} from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { Filter } from '../../types';
import api from '../../utils/api';
import {
  getDateRange,
  getDuration,
  getSubPeriodData,
  getTimePeriod,
} from '../../utils/dashboard.helpers';
import RevenueIcon from '../icons/RevenueIcon';
import { Card, Heading, Spinner } from '../ui';
import DonutChart from '../ui/Charts/DonutChart';
import LineChart from '../ui/Charts/LineChart';
import StackedBarChart from '../ui/Charts/StackedBarChart';

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

interface SummaryRevenueParams {
  bookings: List<any>;
  tokenSales: List<any>;
  fromDate: Date | string;
  toDate: Date | string;
  stripeSubsPayments?: any[];
  timeFrame: string;
  firstBookingDate?: Date | string | null;
  TIME_ZONE: string;
  listings: List<any>;
  TOKEN_PRICE: number;
}

const getSummaryRevenueData = ({
  bookings,
  tokenSales,
  fromDate,
  toDate,
  stripeSubsPayments = [],
  timeFrame,
  firstBookingDate,
  TIME_ZONE,
  listings,
  TOKEN_PRICE,
}: SummaryRevenueParams) => {
  if (!bookings || !tokenSales) return null;

  // Initialize all revenue types with 0
  let totalHospitality = 0;
  let totalSpaces = 0;
  let totalEvents = 0;
  let totalSubscriptions = 0;
  let totalFood = 0;
  let totalTokens = 0;

  // Get revenue data by subperiods first
  const timePeriod = getTimePeriod(
    timeFrame,
    fromDate,
    toDate,
    firstBookingDate?.toString() || undefined,
  );

  timePeriod.subPeriods.forEach((subPeriod: any) => {
    const periodData = getSubPeriodData({
      subPeriod,
      bookings,
      tokenSales,
      timeFrame,
      fromDate,
      toDate,
      firstBookingDate: firstBookingDate?.toString() || '',
      TIME_ZONE,
      stripeSubsPayments,
      listings,
      TOKEN_PRICE,
    });

    // Sum up all values from each period
    totalHospitality += periodData.hospitality || 0;
    totalSpaces += periodData.spaces || 0;
    totalEvents += periodData.events || 0;
    totalSubscriptions += periodData.subscriptions || 0;
    totalFood += periodData.food || 0;
    totalTokens += periodData.tokens || 0;
  });

  const summaryData = [];

  if (totalHospitality > 0) {
    summaryData.push({ name: 'hospitality', value: totalHospitality });
  }
  if (totalSpaces > 0) {
    summaryData.push({ name: 'spaces', value: totalSpaces });
  }
  if (totalEvents > 0) {
    summaryData.push({ name: 'events', value: totalEvents });
  }
  if (totalSubscriptions > 0) {
    summaryData.push({ name: 'subscriptions', value: totalSubscriptions });
  }
  if (totalFood > 0) {
    summaryData.push({ name: 'food', value: totalFood });
  }
  if (totalTokens > 0) {
    summaryData.push({ name: 'tokens', value: totalTokens });
  }

  return summaryData;
};

const DashboardRevenue = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { TIME_ZONE, TOKEN_PRICE, APP_NAME } = useConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<Filter | null>(null);
  const [stripeSubsPayments, setStripeSubsPayments] = useState<any[]>([]);

  const listingFilter = {
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  };

  const tokenSalesFilter = {
    where: {},
    limit: MAX_BOOKINGS_TO_FETCH,
  };

  const bookings = platform.booking.find(bookingFilter);
  const listings = platform.listing.find(listingFilter);
  const tokenSales =
    APP_NAME === 'tdf' ? platform.metrics.findTokenSales('metrics') : [];

  const firstBooking =
    bookings &&
    bookings.find((booking: any) => {
      return paidStatuses.includes(booking.get('status'));
    });

  const firstBookingDate = firstBooking && firstBooking?.get('start');

  const duration = getDuration(timeFrame, fromDate, toDate);

  const getRevenueData = (
    bookings: any,
    tokenSales: any,
    fromDate: Date | string,
    toDate: Date | string,
  ) => {
    if (timeFrame === 'custom' && !toDate) return [];
    const data: any[] = [];

    const timePeriod = getTimePeriod(
      timeFrame,
      fromDate,
      toDate,
      firstBookingDate,
    );

    timePeriod.subPeriods.forEach((subPeriod: any) => {
      const subPeriodData = getSubPeriodData({
        subPeriod,
        bookings,
        tokenSales,
        timeFrame,
        fromDate,
        toDate,
        firstBookingDate,
        TIME_ZONE,
        stripeSubsPayments,
        listings,
        TOKEN_PRICE,
      });

      data.push(subPeriodData);
    });

    return data;
  };

  const summaryRevenueData = getSummaryRevenueData({
    bookings,
    tokenSales,
    fromDate,
    toDate,
    stripeSubsPayments,
    timeFrame,
    firstBookingDate,
    TIME_ZONE,
    listings,
    TOKEN_PRICE,
  });

  const revenueData =
    bookings &&
    duration &&
    listings &&
    tokenSales &&
    getRevenueData(bookings, tokenSales, fromDate, toDate);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.booking.get(bookingFilter),
        platform.listing.get(listingFilter),
        APP_NAME === 'tdf'
          ? platform.metrics.getTokenSales(tokenSalesFilter)
          : [],
      ]);
    } catch (err) {
      console.log('Error fetching  data:', err);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (bookingFilter) {
      loadData();
    }
  }, [bookingFilter]);

  useEffect(() => {
    const { start, end } = getDateRange({
      timeFrame,
      fromDate,
      toDate,
      timeZone: TIME_ZONE,
    });

    if (APP_NAME === 'tdf') {
      (async () => {
        try {
          setIsStripeLoading(true);
          const res = await api.post('/stripe-data/subscription-payments', {
            start,
            end,
          });
          // const transactionsRes = await api.post('/stripe-data/transactions', {
          //   start,
          //   end,
          // });

          // console.log('transactionsRes=', transactionsRes.data.results);

          setStripeSubsPayments(res.data.results);
        } catch (error) {
          console.log('Error fetching stripe subs payments:', error);
        } finally {
          setIsStripeLoading(false);
        }
      })();
    } else {
      setStripeSubsPayments([]);
    }

    if (timeFrame === 'allTime') {
      setBookingFilter({
        where: {
          status: {
            $in: paidStatuses,
          },
        },
        sort_by: 'start',
        limit: MAX_BOOKINGS_TO_FETCH,
      });
    } else {
      setBookingFilter({
        where: {
          status: {
            $in: paidStatuses,
          },
          $and: [{ start: { $lte: end } }, { end: { $gte: start } }],
        },

        sort_by: 'start',
        limit: MAX_BOOKINGS_TO_FETCH,
      });
    }
  }, [timeFrame, fromDate, toDate]);

  return (
    <section className="bg-white rounded-md px-0 sm:px-6 py-6 flex flex-col gap-6">
      <Heading level={3} className="uppercase text-md flex gap-3">
        <RevenueIcon /> {t('dashboard_revenue_title')}
      </Heading>

      <div className={' grid-cols-1 grid gap-4 min-h-[300px]'}>
        <Card className="col-span-1 lg:col-span-2 p-2 gap-2 h-[300px] sm:h-auto">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_general_revenue')}
          </Heading>

          <div className="relative">
            {isStripeLoading && (
              <div className="absolute top-0 left-0 flex gap-2 items-center">
                <Spinner /> Updating Stripe data...
              </div>
            )}
          </div>
          {isLoading ? <Spinner /> : <StackedBarChart data={revenueData} />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_revenue_by_source')}
          </Heading>
          <div
            className={`${
              isMobile ? 'h-[280px]' : 'h-[220px]'
            } overflow-hidden`}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <DonutChart data={summaryRevenueData || []} isEur={true} />
            )}
          </div>
        </Card>

        {APP_NAME === 'tdf' && (
          <Card className="col-span-1 p-2 gap-2">
            <Heading level={3} className="uppercase text-sm">
              {t('dashboard_token_revenue')}
            </Heading>

            <LineChart data={revenueData} />
          </Card>
        )}
      </div>
    </section>
  );
};

export default DashboardRevenue;
