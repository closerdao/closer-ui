import Head from 'next/head';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import ChargesTable from '../../../components/Dashboard/ChargesTable';
import RevenueTimeFrameSelector from '../../../components/Dashboard/RevenueTimeFrameSelector';
import Pagination from '../../../components/Pagination';
import { Heading } from '../../../components/ui';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { BookingConfig } from '../../../types/api';
import { ExpenseTrackingCombinedEntry } from '../../../types/expense';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import {
  filterCombinedEntriesToIncomeFrToconlineDocuments,
  getCombinedEntryRowKey,
  parseExpenseTrackingCombinedEntriesPayload,
  sortCombinedExpenseEntriesByDateDesc,
} from '../../../utils/expenseTracking.helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { getStartAndEndDate } from '../../../utils/performance.utils';

const ENTRIES_PER_PAGE = 50;
const CHARGE_DOWNLOAD_LIMIT = 3000;

const RevenuePage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const router = useRouter();
  const { time_frame } = router.query;

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [timeFrame, setTimeFrame] = useState<string>(() =>
    typeof time_frame === 'string' ? time_frame : 'currentMonth',
  );
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [combinedEntries, setCombinedEntries] = useState<
    ExpenseTrackingCombinedEntry[]
  >([]);
  const [moneriumCharges, setMoneriumCharges] = useState<
    ExpenseTrackingCombinedEntry[]
  >([]);
  const [cryptoTokenCharges, setCryptoTokenCharges] = useState<
    ExpenseTrackingCombinedEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [moneriumLoading, setMoneriumLoading] = useState<boolean>(false);
  const [cryptoLoading, setCryptoLoading] = useState<boolean>(false);

  const [categorySums, setCategorySums] = useState<{
    tokenSales: number;
    cryptoTokenSales: number;
    events: number;
    rental: number;
    food: number;
    utilities: number;
    subscriptions: number;
    refunds: number;
    connectFee: number;
    stripeProcessingFee: number;
    other: number;
  }>({
    tokenSales: 0,
    cryptoTokenSales: 0,
    events: 0,
    rental: 0,
    food: 0,
    utilities: 0,
    subscriptions: 0,
    refunds: 0,
    connectFee: 0,
    stripeProcessingFee: 0,
    other: 0,
  });
  const [sumsLoading, setSumsLoading] = useState<boolean>(false);

  const entriesDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sumsDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadCombinedEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getStartAndEndDate(
        timeFrame,
        fromDate,
        toDate,
      );

      const response = await api.get('/income-tracking/combined-entries', {
        params: {
          from: dayjs(startDate).format('YYYY-MM-DD'),
          to: dayjs(endDate).format('YYYY-MM-DD'),
          page: 1,
          limit: CHARGE_DOWNLOAD_LIMIT,
          sort_by: '-date',
          toconline_document_type: 'FR',
        },
      });

      const parsed = parseExpenseTrackingCombinedEntriesPayload(response.data);
      const filtered = filterCombinedEntriesToIncomeFrToconlineDocuments(
        parsed.entries,
      );

      setCombinedEntries(filtered);
    } catch (error) {
      console.error('Error fetching combined entries:', error);
      setCombinedEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  const fetchMoneriumCharges = useCallback(async () => {
    setMoneriumLoading(true);
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
          limit: 1000,
          sort: '-date',
        },
      });

      const charges = response.data.results || [];
      const moneriumEntries: ExpenseTrackingCombinedEntry[] = charges.map(
        (charge: any) => {
          const id =
            typeof charge._id === 'string'
              ? charge._id
              : charge._id?.$oid || String(charge._id || '');
          const date =
            typeof charge.date === 'string'
              ? charge.date
              : charge.date?.$date || charge.date;

          return {
            kind: 'charge',
            charge: {
              ...charge,
              _id: id,
              date: date,
              amount: {
                ...charge.amount,
                total: {
                  ...charge.amount?.total,
                  val: parseFloat(charge.amount?.total?.val) || 0,
                },
              },
            },
            toconline: { status: 'none' },
          };
        },
      );

      setMoneriumCharges(moneriumEntries);
    } catch (error) {
      console.error('Error fetching monerium charges:', error);
      setMoneriumCharges([]);
    } finally {
      setMoneriumLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  const fetchCryptoTokenCharges = useCallback(async () => {
    setCryptoLoading(true);
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
          limit: 1000,
          sort: '-date',
        },
      });

      const charges = response.data.results || [];
      const cryptoEntries: ExpenseTrackingCombinedEntry[] = charges.map(
        (charge: any) => {
          const id =
            typeof charge._id === 'string'
              ? charge._id
              : charge._id?.$oid || String(charge._id || '');
          const date =
            typeof charge.date === 'string'
              ? charge.date
              : charge.date?.$date || charge.date;

          return {
            kind: 'charge',
            charge: {
              ...charge,
              _id: id,
              date: date,
              amount: {
                ...charge.amount,
                total: {
                  ...charge.amount?.total,
                  val:
                    typeof charge.amount?.total?.val === 'number'
                      ? charge.amount.total.val
                      : parseFloat(charge.amount?.total?.val || '0') || 0,
                },
              },
            },
            toconline: { status: 'none' },
          };
        },
      );

      setCryptoTokenCharges(cryptoEntries);
    } catch (error) {
      console.error('Error fetching crypto token charges:', error);
      setCryptoTokenCharges([]);
    } finally {
      setCryptoLoading(false);
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

      const startDateStr = dayjs(startDate).format('YYYY-MM-DD');
      const endDateStr = dayjs(endDate).format('YYYY-MM-DD');

      const dateFilter = {
        $gte: startDateStr,
        $lte: endDateStr,
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
        connectFeeRes,
        stripeFeeRes,
      ] = await Promise.all([
        api
          .get('/sum/charge/amount.total.val', {
            params: {
              where: {
                date: dateFilter,
                method: 'monerium',
                status: 'paid',
                type: { $in: ['tokenSale', 'fiatTokenSale', 'citizenship'] },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/amount.total.val', {
            params: {
              where: {
                date: dateFilter,
                method: 'crypto',
                status: 'paid',
                type: { $in: ['tokenSale', 'fiatTokenSale', 'citizenship'] },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/amount.event.val', {
            params: {
              where: {
                date: dateFilter,
                status: { $ne: 'refunded' },
                type: {
                  $nin: [
                    'tokenSale',
                    'fiatTokenSale',
                    'citizenship',
                    'subscription',
                  ],
                },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/amount.rental.val', {
            params: {
              where: {
                date: dateFilter,
                status: { $ne: 'refunded' },
                type: {
                  $nin: [
                    'tokenSale',
                    'fiatTokenSale',
                    'citizenship',
                    'subscription',
                  ],
                },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/amount.food.val', {
            params: {
              where: {
                date: dateFilter,
                status: { $ne: 'refunded' },
                type: {
                  $nin: [
                    'tokenSale',
                    'fiatTokenSale',
                    'citizenship',
                    'subscription',
                  ],
                },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/amount.utilities.val', {
            params: {
              where: {
                date: dateFilter,
                status: { $ne: 'refunded' },
                type: {
                  $nin: [
                    'tokenSale',
                    'fiatTokenSale',
                    'citizenship',
                    'subscription',
                  ],
                },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/amount.total.val', {
            params: {
              where: {
                date: dateFilter,
                type: 'subscription',
                status: { $ne: 'refunded' },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/amount.total.val', {
            params: {
              where: { date: dateFilter, status: 'refunded' },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/meta.stripeConnectFee', {
            params: {
              where: {
                date: dateFilter,
                method: 'stripe',
                status: { $ne: 'refunded' },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
        api
          .get('/sum/charge/meta.stripeProcessingFee', {
            params: {
              where: {
                date: dateFilter,
                method: 'stripe',
                status: { $ne: 'refunded' },
              },
            },
          })
          .catch(() => ({ data: { sum: 0 } })),
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
        connectFee: connectFeeRes.data?.sum || 0,
        stripeProcessingFee: stripeFeeRes.data?.sum || 0,
        other: 0,
      });
    } catch (error) {
      console.error('Error fetching category sums:', error);
    } finally {
      setSumsLoading(false);
    }
  }, [timeFrame, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFrame, fromDate, toDate]);

  useEffect(() => {
    if (!router.isReady) return;
    if (timeFrame === 'custom' && (!fromDate || !toDate)) return;

    if (entriesDebounceTimeoutRef.current) {
      clearTimeout(entriesDebounceTimeoutRef.current);
    }

    const timeout = setTimeout(
      () => {
        loadCombinedEntries();
      },
      timeFrame === 'custom' ? 500 : 0,
    );

    entriesDebounceTimeoutRef.current = timeout;

    return () => clearTimeout(timeout);
  }, [router.isReady, timeFrame, fromDate, toDate, loadCombinedEntries]);

  useEffect(() => {
    if (!router.isReady) return;
    if (timeFrame === 'custom' && (!fromDate || !toDate)) return;

    const timeout = setTimeout(
      () => {
        fetchMoneriumCharges();
      },
      timeFrame === 'custom' ? 500 : 0,
    );

    return () => clearTimeout(timeout);
  }, [router.isReady, timeFrame, fromDate, toDate, fetchMoneriumCharges]);

  useEffect(() => {
    if (!router.isReady) return;
    if (timeFrame === 'custom' && (!fromDate || !toDate)) return;

    const timeout = setTimeout(
      () => {
        fetchCryptoTokenCharges();
      },
      timeFrame === 'custom' ? 500 : 0,
    );

    return () => clearTimeout(timeout);
  }, [router.isReady, timeFrame, fromDate, toDate, fetchCryptoTokenCharges]);

  useEffect(() => {
    if (!router.isReady) return;
    if (timeFrame === 'custom' && (!fromDate || !toDate)) return;

    if (sumsDebounceTimeoutRef.current) {
      clearTimeout(sumsDebounceTimeoutRef.current);
    }

    const timeout = setTimeout(
      () => {
        fetchCategorySums();
      },
      timeFrame === 'custom' ? 500 : 0,
    );

    sumsDebounceTimeoutRef.current = timeout;

    return () => clearTimeout(timeout);
  }, [router.isReady, timeFrame, fromDate, toDate, fetchCategorySums]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categorySumsFromEntries = useMemo(() => {
    const sums = {
      tokenSales: 0,
      cryptoTokenSales: 0,
      events: 0,
      rental: 0,
      food: 0,
      utilities: 0,
      subscriptions: 0,
      refunds: 0,
      connectFee: 0,
      stripeProcessingFee: 0,
      other: 0,
    };

    const allEntries = [
      ...combinedEntries,
      ...moneriumCharges,
      ...cryptoTokenCharges,
    ];

    const tokenSaleTypes = ['tokenSale', 'fiatTokenSale', 'citizenship'];

    allEntries.forEach((entry) => {
      if (entry.kind === 'charge') {
        const charge: any = entry.charge;
        const status = charge.status;
        const type = charge.type;
        const method = charge.method;

        if (status === 'refunded') {
          sums.refunds += charge.amount?.total?.val || 0;
          return;
        }

        if (status !== 'paid' && status !== 'pending-payment') return;

        if (tokenSaleTypes.includes(type)) {
          if (method === 'crypto') {
            sums.cryptoTokenSales += charge.amount?.total?.val || 0;
          } else {
            sums.tokenSales += charge.amount?.total?.val || 0;
          }
        } else if (type === 'subscription') {
          sums.subscriptions += charge.amount?.total?.val || 0;
        } else {
          // Booking or Other
          const r = charge.amount?.rental?.val || 0;
          const f = charge.amount?.food?.val || 0;
          const u = charge.amount?.utilities?.val || 0;
          const e = charge.amount?.event?.val || 0;
          const t = charge.amount?.total?.val || 0;

          sums.rental += r;
          sums.food += f;
          sums.utilities += u;
          sums.events += e;

          const breakdownSum = r + f + u + e;
          if (t > breakdownSum) {
            sums.other += t - breakdownSum;
          }
        }

        if (method === 'stripe') {
          sums.connectFee += charge.meta?.stripeConnectFee || 0;
          sums.stripeProcessingFee += charge.meta?.stripeProcessingFee || 0;
        }
      }
    });

    return sums;
  }, [combinedEntries, moneriumCharges, cryptoTokenCharges]);

  const allEntriesSorted = useMemo(() => {
    const combined = [
      ...combinedEntries,
      ...moneriumCharges,
      ...cryptoTokenCharges,
    ];

    // Deduplicate by charge ID if applicable
    const uniqueMap = new Map<string, ExpenseTrackingCombinedEntry>();
    const result: ExpenseTrackingCombinedEntry[] = [];

    combined.forEach((entry) => {
      const key = getCombinedEntryRowKey(entry);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, entry);
        result.push(entry);
      }
    });

    return sortCombinedExpenseEntriesByDateDesc(result);
  }, [combinedEntries, moneriumCharges, cryptoTokenCharges]);

  const displayedEntries = useMemo(() => {
    const start = (currentPage - 1) * ENTRIES_PER_PAGE;
    return allEntriesSorted.slice(start, start + ENTRIES_PER_PAGE);
  }, [allEntriesSorted, currentPage]);

  const totalDisplayCount = allEntriesSorted.length;

  const getCategoryTotals = () => {
    const totals = {
      tokenSales: Math.max(
        categorySums.tokenSales,
        categorySumsFromEntries.tokenSales,
      ),
      cryptoTokenSales: Math.max(
        categorySums.cryptoTokenSales,
        categorySumsFromEntries.cryptoTokenSales,
      ),
      events: Math.max(categorySums.events, categorySumsFromEntries.events),
      rental: Math.max(categorySums.rental, categorySumsFromEntries.rental),
      food: Math.max(categorySums.food, categorySumsFromEntries.food),
      utilities: Math.max(
        categorySums.utilities,
        categorySumsFromEntries.utilities,
      ),
      connectFee: Math.max(
        categorySums.connectFee,
        categorySumsFromEntries.connectFee,
      ),
      subscriptions: Math.max(
        categorySums.subscriptions,
        categorySumsFromEntries.subscriptions,
      ),
      refunds: Math.max(categorySums.refunds, categorySumsFromEntries.refunds),
      other: Math.max(categorySums.other, categorySumsFromEntries.other),
      stripeFee: Math.max(
        0,
        Math.max(
          categorySums.stripeProcessingFee,
          categorySumsFromEntries.stripeProcessingFee,
        ) -
          Math.max(categorySums.connectFee, categorySumsFromEntries.connectFee),
      ),
    };
    return totals;
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
      <AdminLayout>
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

        <div className="space-y-4 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg min-w-0">
              <div className="p-3">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('dashboard_revenue_total')}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {sumsLoading ? (
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
                          categoryTotals.cryptoTokenSales +
                          categoryTotals.other,
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
                    {sumsLoading ? (
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
                    {sumsLoading ? (
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
                    {sumsLoading ? (
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
                    {sumsLoading ? (
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
                    {sumsLoading ? (
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
                <Heading level={3}>
                  {t('dashboard_revenue_by_category')}
                </Heading>
                <div className="flex items-end justify-between gap-2 h-32">
                  {[
                    {
                      name: t('dashboard_revenue_fiat_token_sales'),
                      amount: categoryTotals.tokenSales,
                      bgColor: 'bg-blue-200',
                      textColor: 'text-blue-800',
                      animateColor: 'bg-blue-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_revenue_crypto_token_sales'),
                      amount: categoryTotals.cryptoTokenSales,
                      bgColor: 'bg-red-200',
                      textColor: 'text-red-800',
                      animateColor: 'bg-red-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_charges_event'),
                      amount: categoryTotals.events,
                      bgColor: 'bg-purple-200',
                      textColor: 'text-purple-800',
                      animateColor: 'bg-purple-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_charges_rental'),
                      amount: categoryTotals.rental,
                      bgColor: 'bg-green-200',
                      textColor: 'text-green-800',
                      animateColor: 'bg-green-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_charges_food'),
                      amount: categoryTotals.food,
                      bgColor: 'bg-orange-200',
                      textColor: 'text-orange-800',
                      animateColor: 'bg-orange-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_charges_utilities'),
                      amount: categoryTotals.utilities,
                      bgColor: 'bg-cyan-200',
                      textColor: 'text-cyan-800',
                      animateColor: 'bg-cyan-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_revenue_subscriptions'),
                      amount: categoryTotals.subscriptions,
                      bgColor: 'bg-pink-200',
                      textColor: 'text-pink-800',
                      animateColor: 'bg-pink-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_revenue_other'),
                      amount: categoryTotals.other,
                      bgColor: 'bg-gray-200',
                      textColor: 'text-gray-800',
                      animateColor: 'bg-gray-300',
                      loading: sumsLoading,
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
                <Heading level={3}>
                  {t('dashboard_revenue_expenses_by_category')}
                </Heading>
                <div className="flex items-end justify-between gap-2 h-32">
                  {[
                    {
                      name: t('dashboard_revenue_refunds'),
                      amount: categoryTotals.refunds,
                      bgColor: 'bg-red-200',
                      textColor: 'text-red-800',
                      animateColor: 'bg-red-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_revenue_stripe_fee'),
                      amount: categoryTotals.stripeFee,
                      bgColor: 'bg-amber-200',
                      textColor: 'text-amber-800',
                      animateColor: 'bg-amber-300',
                      loading: sumsLoading,
                    },
                    {
                      name: t('dashboard_revenue_connect_fee'),
                      amount: categoryTotals.connectFee,
                      bgColor: 'bg-yellow-200',
                      textColor: 'text-yellow-800',
                      animateColor: 'bg-yellow-300',
                      loading: sumsLoading,
                    },
                  ].map((category) => (
                    <div
                      key={category.name}
                      className="flex flex-col items-center justify-end flex-1 h-full"
                    >
                      <div
                        className={`${category.bgColor} rounded-t-lg w-full flex flex-col items-center justify-end pb-2`}
                        style={{
                          height: `${getExpenseBarHeight(category.amount)}%`,
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
            entries={displayedEntries}
            loading={isLoading || moneriumLoading || cryptoLoading}
            totalCount={totalDisplayCount}
            currentPage={currentPage}
            itemsPerPage={ENTRIES_PER_PAGE}
          />

          {totalDisplayCount > ENTRIES_PER_PAGE && (
            <Pagination
              loadPage={handlePageChange}
              page={currentPage}
              limit={ENTRIES_PER_PAGE}
              total={totalDisplayCount}
            />
          )}
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
