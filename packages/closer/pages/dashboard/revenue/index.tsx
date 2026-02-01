import Head from 'next/head';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useRef, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import ChargesTable from '../../../components/Dashboard/ChargesTable';
import RevenueTimeFrameSelector from '../../../components/Dashboard/RevenueTimeFrameSelector';
import { Heading } from '../../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { BookingConfig } from '../../../types/api';
import { Charge } from '../../../types/booking';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { getStartAndEndDate } from '../../../utils/performance.utils';

const RevenuePage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const router = useRouter();
  const { time_frame } = router.query;

  const isTokenEnabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const areSubscriptionsEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const isCitizenshipEnabled =
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [timeFrame, setTimeFrame] = useState<string>(() =>
    typeof time_frame === 'string' ? time_frame : 'currentMonth',
  );
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [charges, setCharges] = useState<Charge[]>([]);
  const [moneriumCharges, setMoneriumCharges] = useState<Charge[]>([]);
  const [cryptoTokenCharges, setCryptoTokenCharges] = useState<Charge[]>([]);
  const [chargesLoading, setChargesLoading] = useState<boolean>(false);
  const [moneriumChargesLoading, setMoneriumChargesLoading] =
    useState<boolean>(false);
  const [cryptoTokenChargesLoading, setCryptoTokenChargesLoading] =
    useState<boolean>(false);
  const [categorySums, setCategorySums] = useState<{
    tokenSales: number;
    cryptoTokenSales: number;
    events: number;
    rental: number;
    food: number;
    utilities: number;
    subscriptions: number;
    refunds: number;
  }>({
    tokenSales: 0,
    cryptoTokenSales: 0,
    events: 0,
    rental: 0,
    food: 0,
    utilities: 0,
    subscriptions: 0,
    refunds: 0,
  });
  const [sumsLoading, setSumsLoading] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCharges = useCallback(async () => {
    setChargesLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate,
        toDate,
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
          limit: 3000,
          sort: '-date',
        },
      });
      // Sort charges from newest to oldest (client-side backup)
      const sortedCharges = response.data.results.sort(
        (a: Charge, b: Charge) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Newest first (descending)
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
        fromDate,
        toDate,
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
          limit: 3000,
          sort: '-date',
        },
      });
      console.log('monerium response.data=======', response.data);
      // Sort charges from newest to oldest (client-side backup)
      const sortedCharges = response.data.results.sort(
        (a: Charge, b: Charge) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Newest first (descending)
        },
      );

      // Convert string values to numbers for proper calculations
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

      console.log('processed monerium charges=======', processedCharges);
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
        fromDate,
        toDate,
      );

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
          limit: 3000,
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
            val:
              typeof charge.amount.total.val === 'number'
                ? charge.amount.total.val
                : parseFloat(charge.amount.total.val || '0') || 0,
          },
        },
      }));

      setCryptoTokenCharges(processedCharges);
    } catch (error) {
      console.error('Error fetching crypto token charges:', error);
    } finally {
      setCryptoTokenChargesLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  const fetchCategorySums = useCallback(async () => {
    setSumsLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate,
        toDate,
      );

      const dateFilter = {
        $gte: startDate,
        $lte: endDate,
      };

      const [
        tokenSalesRes,
        cryptoTokenSalesRes,
        eventsRes,
        rentalRes,
        foodRes,
        utilitiesRes,
        subscriptionsRes,
        refundsRes,
      ] = await Promise.all([
        api.get('/sum/charge/amount.total.val', {
          params: {
            where: { date: dateFilter, method: 'monerium', status: 'paid' },
          },
        }).catch(() => ({ data: { sum: 0 } })),
        api.get('/sum/charge/amount.total.val', {
          params: {
            where: { date: dateFilter, method: 'crypto', status: 'paid' },
          },
        }).catch(() => ({ data: { sum: 0 } })),
        api.get('/sum/charge/amount.event.val', {
          params: {
            where: { date: dateFilter, method: 'stripe', status: { $ne: 'refunded' } },
          },
        }).catch(() => ({ data: { sum: 0 } })),
        api.get('/sum/charge/amount.rental.val', {
          params: {
            where: { date: dateFilter, method: 'stripe', status: { $ne: 'refunded' } },
          },
        }).catch(() => ({ data: { sum: 0 } })),
        api.get('/sum/charge/amount.food.val', {
          params: {
            where: { date: dateFilter, method: 'stripe', status: { $ne: 'refunded' } },
          },
        }).catch(() => ({ data: { sum: 0 } })),
        api.get('/sum/charge/amount.utilities.val', {
          params: {
            where: { date: dateFilter, method: 'stripe', status: { $ne: 'refunded' } },
          },
        }).catch(() => ({ data: { sum: 0 } })),
        api.get('/sum/charge/amount.total.val', {
          params: {
            where: { date: dateFilter, method: 'stripe', type: 'subscription', status: { $ne: 'refunded' } },
          },
        }).catch(() => ({ data: { sum: 0 } })),
        api.get('/sum/charge/amount.total.val', {
          params: {
            where: { date: dateFilter, status: 'refunded' },
          },
        }).catch(() => ({ data: { sum: 0 } })),
      ]);

      setCategorySums({
        tokenSales: tokenSalesRes.data?.sum || 0,
        cryptoTokenSales: cryptoTokenSalesRes.data?.sum || 0,
        events: eventsRes.data?.sum || 0,
        rental: rentalRes.data?.sum || 0,
        food: foodRes.data?.sum || 0,
        utilities: utilitiesRes.data?.sum || 0,
        subscriptions: subscriptionsRes.data?.sum || 0,
        refunds: refundsRes.data?.sum || 0,
      });
    } catch (error) {
      console.error('Error fetching category sums:', error);
    } finally {
      setSumsLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  // Single effect for all time frames
  useEffect(() => {
    if (!router.isReady) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // For custom time frame, only fetch if both dates are set
    if (timeFrame === 'custom') {
      if (fromDate && toDate) {
        const timeout = setTimeout(() => {
          fetchCharges();
          fetchMoneriumCharges();
          fetchCryptoTokenCharges();
          fetchCategorySums();
        }, 500); // 500ms debounce
        debounceTimeoutRef.current = timeout;
      }
    } else {
      // For other time frames, fetch immediately
      fetchCharges();
      fetchMoneriumCharges();
      fetchCryptoTokenCharges();
      fetchCategorySums();
    }

    // Cleanup timeout
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    router.isReady,
    timeFrame,
    fromDate,
    toDate,
    fetchCharges,
    fetchMoneriumCharges,
    fetchCryptoTokenCharges,
    fetchCategorySums,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleTimeFrameChange = (
    value: string | ((prevState: string) => string),
  ) => {
    const newTimeFrame = typeof value === 'function' ? value(timeFrame) : value;
    setTimeFrame(newTimeFrame);

    router.replace(
      {
        pathname: '/dashboard/revenue',
        query: { time_frame: newTimeFrame },
      },
      undefined,
      { shallow: true },
    );
  };

  const getCategoryTotals = () => {
    const connectFee = charges
      .filter((charge) => charge.status !== 'refunded')
      .reduce((sum, charge) => sum + (charge.meta?.stripeConnectFee || 0), 0);

    const stripeFee = charges
      .filter((charge) => charge.status !== 'refunded')
      .reduce(
        (sum, charge) =>
          sum +
          (charge.meta?.stripeProcessingFee || 0) -
          (charge.meta?.stripeConnectFee || 0),
        0,
      );

    return {
      tokenSales: categorySums.tokenSales,
      cryptoTokenSales: categorySums.cryptoTokenSales,
      events: categorySums.events,
      rental: categorySums.rental,
      food: categorySums.food,
      utilities: categorySums.utilities,
      connectFee,
      subscriptions: categorySums.subscriptions,
      refunds: categorySums.refunds,
      stripeFee,
    };
  };

  const categoryTotals = getCategoryTotals();
  const maxAmount = Math.max(...Object.values(categoryTotals));

  const getBarHeight = (amount: number) => {
    if (maxAmount === 0) return 5;
    return Math.max((amount / maxAmount) * 100, 5);
  };

  const getExpenseBarHeight = (amount: number) => {
    const maxExpense = Math.max(
      categoryTotals.refunds,
      categoryTotals.stripeFee,
      categoryTotals.connectFee,
    );
    if (maxExpense === 0) return 5;
    return Math.max((amount / maxExpense) * 100, 5);
  };

  if (!user || !hasAccess('Revenue')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('dashboard_revenue_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <Heading level={2}>{t('dashboard_revenue_title')}</Heading>
          <RevenueTimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={handleTimeFrameChange}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
          />
        </div>

        <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
                  <div className="p-3">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('dashboard_revenue_total')}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {chargesLoading ||
                        moneriumChargesLoading ||
                        cryptoTokenChargesLoading ||
                        sumsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            categoryTotals.events +
                            categoryTotals.rental +
                            categoryTotals.food +
                            categoryTotals.utilities +
                            categoryTotals.subscriptions +
                            categoryTotals.tokenSales +
                            categoryTotals.cryptoTokenSales,
                          )
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
                  <div className="p-3">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('dashboard_revenue_hospitality')}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {chargesLoading || sumsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            categoryTotals.events +
                              categoryTotals.rental +
                              categoryTotals.food +
                              categoryTotals.utilities,
                          )
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
                  <div className="p-3">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('dashboard_revenue_subscriptions')}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {chargesLoading || sumsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(categoryTotals.subscriptions)
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
                  <div className="p-3">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('dashboard_revenue_fiat_token_sales')}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {moneriumChargesLoading || sumsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(categoryTotals.tokenSales)
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
                  <div className="p-3">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('dashboard_revenue_crypto_token_sales')}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {cryptoTokenChargesLoading || sumsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(categoryTotals.cryptoTokenSales)
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
                  <div className="p-3">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('dashboard_revenue_refunded')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {chargesLoading || moneriumChargesLoading || sumsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(categoryTotals.refunds)
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Revenue and Expenses Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue by Category */}
                <div className="bg-white shadow rounded-lg lg:col-span-2 space-y-6">
                  <div className="px-4 py-5 sm:p-4 space-y-6">
                    <Heading level={3}>{t('dashboard_revenue_by_category')}</Heading>
                    <div className="flex items-end justify-between gap-2 h-64">
                      {[
                        {
                          name: t('dashboard_revenue_fiat_token_sales'),
                          amount: categoryTotals.tokenSales,
                          bgColor: 'bg-blue-200',
                          textColor: 'text-blue-800',
                          animateColor: 'bg-blue-300',
                          loading: moneriumChargesLoading || sumsLoading,
                        },
                        {
                          name: t('dashboard_revenue_crypto_token_sales'),
                          amount: categoryTotals.cryptoTokenSales,
                          bgColor: 'bg-red-200',
                          textColor: 'text-red-800',
                          animateColor: 'bg-red-300',
                          loading: cryptoTokenChargesLoading || sumsLoading,
                        },
                        {
                          name: t('dashboard_charges_event'),
                          amount: categoryTotals.events,
                          bgColor: 'bg-purple-200',
                          textColor: 'text-purple-800',
                          animateColor: 'bg-purple-300',
                          loading: chargesLoading || sumsLoading,
                        },
                        {
                          name: t('dashboard_charges_rental'),
                          amount: categoryTotals.rental,
                          bgColor: 'bg-green-200',
                          textColor: 'text-green-800',
                          animateColor: 'bg-green-300',
                          loading: chargesLoading || sumsLoading,
                        },
                        {
                          name: t('dashboard_charges_food'),
                          amount: categoryTotals.food,
                          bgColor: 'bg-orange-200',
                          textColor: 'text-orange-800',
                          animateColor: 'bg-orange-300',
                          loading: chargesLoading || sumsLoading,
                        },
                        {
                          name: t('dashboard_charges_utilities'),
                          amount: categoryTotals.utilities,
                          bgColor: 'bg-cyan-200',
                          textColor: 'text-cyan-800',
                          animateColor: 'bg-cyan-300',
                          loading: chargesLoading || sumsLoading,
                        },
                        {
                          name: t('dashboard_revenue_subscriptions'),
                          amount: categoryTotals.subscriptions,
                          bgColor: 'bg-pink-200',
                          textColor: 'text-pink-800',
                          animateColor: 'bg-pink-300',
                          loading: chargesLoading || sumsLoading,
                        },
                      ].map((category) => (
                        <div
                          key={category.name}
                          className="flex flex-col items-center justify-end flex-1 h-full"
                        >
                          <div
                            className={`${category.bgColor} rounded-t-lg w-full flex flex-col items-center justify-end pb-2`}
                            style={{
                              height: `${getBarHeight(category.amount)}%`,
                            }}
                          >
                            <div
                              className={`text-xs font-medium ${category.textColor}`}
                            >
                              {category.loading ? (
                                <div
                                  className={`animate-pulse ${category.animateColor} h-3 w-8 rounded`}
                                ></div>
                              ) : (
                                new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'EUR',
                                  maximumFractionDigits: 0,
                                }).format(category.amount)
                              )}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-gray-600 mt-2 text-center truncate max-w-full">
                            {category.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expenses by Category */}
                <div className="bg-white shadow rounded-lg space-y-6">
                  <div className="px-4 py-5 sm:p-4 space-y-6">
                    <Heading level={3}>{t('dashboard_revenue_expenses_by_category')}</Heading>
                    <div className="flex items-end justify-between gap-2 h-64">
                      {[
                        {
                          name: t('dashboard_revenue_refunds'),
                          amount: categoryTotals.refunds,
                          bgColor: 'bg-red-200',
                          textColor: 'text-red-800',
                          animateColor: 'bg-red-300',
                          loading: chargesLoading || moneriumChargesLoading || sumsLoading,
                        },
                        {
                          name: t('dashboard_revenue_stripe_fee'),
                          amount: categoryTotals.stripeFee,
                          bgColor: 'bg-amber-200',
                          textColor: 'text-amber-800',
                          animateColor: 'bg-amber-300',
                          loading: chargesLoading,
                        },
                        {
                          name: t('dashboard_revenue_connect_fee'),
                          amount: categoryTotals.connectFee,
                          bgColor: 'bg-yellow-200',
                          textColor: 'text-yellow-800',
                          animateColor: 'bg-yellow-300',
                          loading: chargesLoading,
                        },
                      ].map((category) => (
                        <div
                          key={category.name}
                          className="flex flex-col items-center justify-end flex-1 h-full"
                        >
                          <div
                            className={`${category.bgColor} rounded-t-lg w-full flex flex-col items-center justify-end pb-2`}
                            style={{
                              height: `${getExpenseBarHeight(
                                category.amount,
                              )}%`,
                            }}
                          >
                            <div
                              className={`text-xs font-medium ${category.textColor}`}
                            >
                              {category.loading ? (
                                <div
                                  className={`animate-pulse ${category.animateColor} h-3 w-8 rounded`}
                                ></div>
                              ) : (
                                new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'EUR',
                                  maximumFractionDigits: 0,
                                }).format(category.amount)
                              )}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-gray-600 mt-2 text-center truncate max-w-full">
                            {category.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <ChargesTable
                charges={[
                  ...charges,
                  ...moneriumCharges,
                  ...cryptoTokenCharges,
                ].sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  return dateB - dateA; // Newest first
                })}
                loading={
                  chargesLoading ||
                  moneriumChargesLoading ||
                  cryptoTokenChargesLoading
                }
              />
        </div>
      </AdminLayout>
    </>
  );
};

RevenuePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, bookingRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      generalConfig,
      bookingConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      bookingConfig: null,
      messages: null,
    };
  }
};

export default RevenuePage;
