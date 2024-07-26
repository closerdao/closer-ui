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
import { useTokenSales } from '../../hooks/useTokenSales';
import { Filter } from '../../types';
import api from '../../utils/api';
import {
  getDateRange,
  getDuration,
  getPeriodName,
  getTimePeriod,
  toEndOfDay,
  toStartOfDay,
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
  const { TIME_ZONE, TOKEN_PRICE } = useConfig();
  const { getTokenSalesForDateRange } = useTokenSales();

  const [isLoading, setIsLoading] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [filter, setFilter] = useState<Filter | null>(null);

  const [stripeSubsPayments, setStripeSubsPayments] = useState<any[]>([]);

  const listingFilter = {
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  };

  const bookings = platform.booking.find(filter);
  const listings = platform.listing.find(listingFilter);

  const duration = getDuration(timeFrame, fromDate, toDate);

  const getRevenueData = (bookings: any) => {
    const data: any[] = [];
    const timePeriod = getTimePeriod(timeFrame, fromDate, toDate);

    timePeriod.subPeriods.forEach((subPeriod: any) => {
      let hospitalityRevenue = 0;
      let spacesRevenue = 0;
      let eventsRevenue = 0;
      let subscriptionsRevenue = 0;
      let foodRevenue = 0;
      let start = null;
      let end = null;

      ({ start, end } = getDateRange({
        timeFrame: 'custom',
        fromDate: subPeriod.start,
        toDate: subPeriod.end,
        timeZone: TIME_ZONE,
      }));

      const timePeriodSubsData = stripeSubsPayments.filter((sub) => {
        const paymentDate = new Date(sub.date);
        const startDate = new Date(start);
        const endDate = new Date(end);

        return paymentDate >= startDate && paymentDate <= endDate;
      });

      subscriptionsRevenue =
        timePeriodSubsData.reduce((acc, curr) => {
          return acc + curr.amount;
        }, 0) / STRIPE_AMOUNT_MULTIPLIER;

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

      data.push({
        name: getPeriodName(subPeriod, timeFrame),
        hospitality: Number(hospitalityRevenue.toFixed(1)),
        spaces: Number(spacesRevenue.toFixed(1)),
        events: Number(eventsRevenue.toFixed(1)),
        subscriptions: Number(subscriptionsRevenue.toFixed(1)),
        food: Number(foodRevenue.toFixed(1)),

        // TODO: calculate token price more precisely
        tokens: Number(
          (
            getTokenSalesForDateRange(
              toStartOfDay(subPeriod.start, TIME_ZONE),
              toEndOfDay(subPeriod.end, TIME_ZONE),
            ) * TOKEN_PRICE
          ).toFixed(1),
        ),
      });
    });

    return data;
  };

  const revenueData =
    bookings && duration && listings && getRevenueData(bookings);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.booking.get(filter),
        platform.listing.get(listingFilter),
      ]);
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filter) {
      loadData();
    }
  }, [filter]);

  useEffect(() => {}, []);

  useEffect(() => {
    const { start, end } = getDateRange({
      timeFrame,
      fromDate,
      toDate,
      timeZone: TIME_ZONE,
    });

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

    setFilter({
      ...filter,
      where: {
        status: {
          $in: paidStatuses,
        },
        $and: [{ start: { $lte: end } }, { end: { $gte: start } }],
      },
      limit: MAX_BOOKINGS_TO_FETCH,
    });
  }, [timeFrame, fromDate, toDate]);

  return (
    <section className="bg-white rounded-md p-6 flex flex-col gap-6">
      <Heading level={3} className="uppercase text-md flex gap-3">
        <RevenueIcon /> {t('dashboard_revenue_title')}
      </Heading>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 ">
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

        <Card className="col-span-1 p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_token_revenue')}
          </Heading>

          <LineChart data={revenueData} />
        </Card>
      </div>
    </section>
  );
};

export default DashboardRevenue;
