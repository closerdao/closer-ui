import { useCallback, useEffect, useState } from 'react';
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
import { Charge } from '../../types/booking';
import api from '../../utils/api';
import {
  getDateRange,
  getDuration,
  getSubPeriodData,
  getTimePeriod,
} from '../../utils/dashboard.helpers';
import { getStartAndEndDate } from '../../utils/performance.utils';
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
  charges,
  moneriumCharges,
  cryptoTokenCharges,
}: {
  charges: Charge[];
  moneriumCharges: Charge[];
  cryptoTokenCharges: Charge[];
}) => {
  // Calculate revenue totals from charges data
  const tokenSales = moneriumCharges.reduce((sum, charge) => {
    const val = charge.amount?.total?.val;
    return sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0);
  }, 0);

  const events = charges
    .filter((charge) => charge.status !== 'refunded')
    .reduce((sum, charge) => {
      const val = charge.amount?.event?.val;
      return (
        sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
      );
    }, 0);

  const rental = charges
    .filter((charge) => charge.status !== 'refunded')
    .reduce((sum, charge) => {
      const val = charge.amount?.rental?.val;
      return (
        sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
      );
    }, 0);

  const food = charges
    .filter((charge) => charge.status !== 'refunded')
    .reduce((sum, charge) => {
      const val = charge.amount?.food?.val;
      return (
        sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
      );
    }, 0);

  const utilities = charges
    .filter((charge) => charge.status !== 'refunded')
    .reduce((sum, charge) => {
      const val = charge.amount?.utilities?.val;
      return (
        sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
      );
    }, 0);

  const subscriptions = charges
    .filter(
      (charge) =>
        charge.status !== 'refunded' && charge.type === 'subscription',
    )
    .reduce((sum, charge) => {
      const val = charge.amount?.total?.val;
      return (
        sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
      );
    }, 0);

  const cryptoTokenSales = cryptoTokenCharges.reduce((sum, charge) => {
    const val = charge.amount?.total?.val;
    return sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0);
  }, 0);

  const summaryData = [];

  // Always include all categories, even if 0, for consistent display
  summaryData.push({ name: 'tokens', value: tokenSales });
  summaryData.push({ name: 'cryptoTokens', value: cryptoTokenSales });
  summaryData.push({ name: 'events', value: events });
  summaryData.push({ name: 'spaces', value: rental });
  summaryData.push({ name: 'food', value: food });
  summaryData.push({ name: 'utilities', value: utilities });
  summaryData.push({ name: 'subscriptions', value: subscriptions });

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
  const [charges, setCharges] = useState<Charge[]>([]);
  const [moneriumCharges, setMoneriumCharges] = useState<Charge[]>([]);
  const [cryptoTokenCharges, setCryptoTokenCharges] = useState<Charge[]>([]);
  const [chargesLoading, setChargesLoading] = useState<boolean>(false);
  const [moneriumChargesLoading, setMoneriumChargesLoading] =
    useState<boolean>(false);
  const [cryptoTokenChargesLoading, setCryptoTokenChargesLoading] =
    useState<boolean>(false);

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

  const fetchCharges = useCallback(async () => {
    setChargesLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate.toString(),
        toDate.toString(),
      );

      const response = await api.get('/charge', {
        params: {
          where: {
            date: {
              $gte: startDate,
              $lte: endDate,
            },
            method: 'stripe',
          },
          limit: 1000,
          sort: '-date',
        },
      });

      const sortedCharges = response.data.results.sort(
        (a: Charge, b: Charge) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        },
      );
      setCharges(sortedCharges);
    } catch (error) {
      console.error('Error fetching charges:', error);
    } finally {
      setChargesLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  const fetchMoneriumCharges = useCallback(async () => {
    setMoneriumChargesLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate.toString(),
        toDate.toString(),
      );

      const response = await api.get('/charge', {
        params: {
          where: {
            date: {
              $gte: startDate,
              $lte: endDate,
            },
            method: 'monerium',
            status: 'paid',
          },
          limit: 1000,
          sort: '-date',
        },
      });

      const sortedCharges = response.data.results.sort(
        (a: Charge, b: Charge) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        },
      );

      const processedCharges = sortedCharges.map((charge: any) => ({
        ...charge,
        amount: {
          ...charge.amount,
          total: {
            ...charge.amount.total,
            val: parseFloat(charge.amount.total.val) || 0,
          },
        },
      }));

      setMoneriumCharges(processedCharges);
    } catch (error) {
      console.error('Error fetching monerium charges:', error);
    } finally {
      setMoneriumChargesLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  const fetchCryptoTokenCharges = useCallback(async () => {
    setCryptoTokenChargesLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate.toString(),
        toDate.toString(),
      );

      console.log('Crypto token charges date range:', {
        startDate,
        endDate,
        timeFrame,
      });

      const response = await api.get('/charge', {
        params: {
          where: {
            date: {
              $gte: startDate,
              $lte: endDate,
            },
            method: 'crypto',
            status: 'paid',
          },
          limit: 1000,
          sort: '-date',
        },
      });

      console.log('Crypto token charges response:', response.data);

      const sortedCharges = response.data.results.sort(
        (a: Charge, b: Charge) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        },
      );

      const processedCharges = sortedCharges.map((charge: any) => ({
        ...charge,
        amount: {
          ...charge.amount,
          total: {
            ...charge.amount.total,
            val:
              typeof charge.amount.total.val === 'number'
                ? charge.amount.total.val
                : parseFloat(charge.amount.total.val || '0') || 0,
          },
        },
      }));

      console.log('Processed crypto token charges:', processedCharges);
      setCryptoTokenCharges(processedCharges);
    } catch (error) {
      console.error('Error fetching crypto token charges:', error);
    } finally {
      setCryptoTokenChargesLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  const firstBooking =
    bookings &&
    bookings.find((booking: any) => {
      return paidStatuses.includes(booking.get('status'));
    });

  const firstBookingDate = firstBooking && firstBooking?.get('start');

  const duration = getDuration(timeFrame, fromDate, toDate);

  const getRevenueData = () => {
    if (timeFrame === 'custom' && !toDate) return [];

    // For TDF, we'll create a data structure based on charges
    if (APP_NAME === 'tdf') {
      const totalTokenSales = moneriumCharges.reduce((sum, charge) => {
        const val = charge.amount?.total?.val;
        return (
          sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
        );
      }, 0);

      const events = charges
        .filter((charge) => charge.status !== 'refunded')
        .reduce((sum, charge) => {
          const val = charge.amount?.event?.val;
          return (
            sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
          );
        }, 0);

      const rental = charges
        .filter((charge) => charge.status !== 'refunded')
        .reduce((sum, charge) => {
          const val = charge.amount?.rental?.val;
          return (
            sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
          );
        }, 0);

      const food = charges
        .filter((charge) => charge.status !== 'refunded')
        .reduce((sum, charge) => {
          const val = charge.amount?.food?.val;
          return (
            sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
          );
        }, 0);

      const utilities = charges
        .filter((charge) => charge.status !== 'refunded')
        .reduce((sum, charge) => {
          const val = charge.amount?.utilities?.val;
          return (
            sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
          );
        }, 0);

      const subscriptions = charges
        .filter(
          (charge) =>
            charge.status !== 'refunded' && charge.type === 'subscription',
        )
        .reduce((sum, charge) => {
          const val = charge.amount?.total?.val;
          return (
            sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
          );
        }, 0);

      const cryptoTokenSales = cryptoTokenCharges.reduce((sum, charge) => {
        const val = charge.amount?.total?.val;
        return (
          sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0)
        );
      }, 0);

      return [
        {
          name: 'Current Period',
          hospitality: events + rental + food + utilities,
          spaces: rental,
          events: events,
          subscriptions: subscriptions,
          food: food,
          tokens: totalTokenSales,
          cryptoTokens: cryptoTokenSales,
          totalOperations:
            events +
            rental +
            food +
            utilities +
            subscriptions +
            totalTokenSales +
            cryptoTokenSales,
        },
      ];
    }

    // For other apps, use the original logic
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
    charges,
    moneriumCharges,
    cryptoTokenCharges,
  });

  const revenueData = getRevenueData();

  // Debug logging
  console.log('DashboardRevenue Debug:', {
    chargesCount: charges.length,
    moneriumChargesCount: moneriumCharges.length,
    cryptoTokenChargesCount: cryptoTokenCharges.length,
    summaryRevenueData,
    revenueData,
    chargesLoading,
    moneriumChargesLoading,
    cryptoTokenChargesLoading,
    APP_NAME,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.booking.get(bookingFilter),
        platform.listing.get(listingFilter),
        APP_NAME === 'tdf'
          ? platform.metrics.getTokenSales(tokenSalesFilter)
          : [],
        fetchCharges(),
        fetchMoneriumCharges(),
        fetchCryptoTokenCharges(),
      ]);
    } catch (err) {
      console.log('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bookingFilter) {
      loadData();
    }
  }, [bookingFilter]);

  // Fetch charges when time frame changes
  useEffect(() => {
    fetchCharges();
    fetchMoneriumCharges();
    fetchCryptoTokenCharges();
  }, [fetchCharges, fetchMoneriumCharges, fetchCryptoTokenCharges]);

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
          {isLoading ||
          chargesLoading ||
          moneriumChargesLoading ||
          cryptoTokenChargesLoading ? (
            <Spinner />
          ) : (
            <StackedBarChart data={revenueData} />
          )}
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
            {isLoading ||
            chargesLoading ||
            moneriumChargesLoading ||
            cryptoTokenChargesLoading ? (
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
