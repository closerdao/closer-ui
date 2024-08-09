import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
  MAX_LISTINGS_TO_FETCH,
  STRIPE_AMOUNT_MULTIPLIER,
  paidStatuses,
} from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { Filter } from '../../types';
import api from '../../utils/api';
import {
  getDateRange,
  getDuration,
  getPeriodName,
  getTimePeriod,
} from '../../utils/dashboard.helpers';
import RevenueIcon from '../icons/RevenueIcon';
import { Card, Heading, Spinner } from '../ui';
import LineChart from '../ui/Charts/LineChart';
import StackedBarChart from '../ui/Charts/StackedBarChart';

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}
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

  const firstBookingDate = firstBooking && firstBooking.get('start');

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

    const diffInDays =
      timeFrame === 'custom'
        ? dayjs(toDate).diff(dayjs(fromDate), 'days')
        : dayjs(new Date()).diff(dayjs(firstBookingDate), 'days');

    timePeriod.subPeriods.forEach((subPeriod: any) => {
      let hospitalityRevenue = 0;
      let spacesRevenue = 0;
      let eventsRevenue = 0;
      let subscriptionsRevenue = 0;
      let foodRevenue = 0;
      let start: Date | string = '';
      let end: Date | string = '';

      ({ start, end } = getDateRange({
        timeFrame: 'custom',
        fromDate: subPeriod.start,
        toDate: subPeriod.end,
        timeZone: TIME_ZONE,
      }));

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

      const timePeriodSubsData = stripeSubsPayments.filter((sub) => {
        const paymentDate = new Date(sub.date);
        const startDate = new Date(start);
        const endDate = new Date(end);

        return paymentDate >= startDate && paymentDate <= endDate;
      });

      subscriptionsRevenue =
        timePeriodSubsData.reduce((acc, curr) => {
          return acc + curr.amount;
        }, 0) / STRIPE_AMOUNT_MULTIPLIER || 0;

      const filteredBookings = bookings.filter((booking: any) => {
        return (
          dayjs(booking.get('start')).isBefore(end) &&
          dayjs(booking.get('end')).isAfter(start)
        );
      });

      filteredBookings.forEach((booking: any) => {
        const listing = listings.find((listing: any) => {
          return listing.get('_id') === booking.get('listing');
        });

        const isCheckin =
          dayjs(booking.get('start')).isAfter(start) &&
          dayjs(booking.get('start')).isBefore(end);
        const isEvent = booking.get('eventId');
        const isNightly =
          listing?.get('priceDuration') === 'night' ||
          !listing?.get('priceDuration');

        if (isCheckin) {
          if (isNightly) {
            const fiatPrice = booking.get('rentalFiat').get('val');

            hospitalityRevenue += fiatPrice;

            const utilityPrice = booking.get('utilityFiat').get('val');
            foodRevenue += utilityPrice;
          }
          if (!isNightly) {
            const fiatPrice = booking.get('rentalFiat').get('val');
            spacesRevenue += fiatPrice;
          }
          if (isEvent) {
            const ticketPrice = booking.get('ticketOption').get('price');
            eventsRevenue += ticketPrice;
          }
        }
      });

      const totalOperations = Math.floor(
        Number(hospitalityRevenue) +
          Number(spacesRevenue) +
          Number(eventsRevenue) +
          Number(subscriptionsRevenue) +
          Number(foodRevenue),
      );

      data.push({
        name: getPeriodName(subPeriod, timeFrame, diffInDays),
        hospitality: Number(hospitalityRevenue.toFixed(1)),
        spaces: Number(spacesRevenue.toFixed(1)),
        events: Number(eventsRevenue.toFixed(1)),
        subscriptions: Number(subscriptionsRevenue.toFixed(1)),
        food: Number(foodRevenue.toFixed(1)),

        // TODO: calculate token price more precisely
        tokens: Number((timePeriodTokenRevenue * TOKEN_PRICE).toFixed(1)),
        totalOperations,
      });
    });

    return data;
  };

  const revenueData =
    bookings &&
    duration &&
    listings &&
    tokenSales &&
    firstBookingDate &&
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
          const res = await api.post('/stripe/subscription-payments', {
            start,
            end,
          });

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

      <div
        className={`${
          APP_NAME === 'tdf' ? 'lg:grid-cols-3' : ''
        } grid-cols-1 grid gap-4 min-h-[300px]`}
      >
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
