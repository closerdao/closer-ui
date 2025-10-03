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
import { BookingConfig } from '../../../types/api';
import { Charge } from '../../../types/booking';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import { getStartAndEndDate } from '../../../utils/performance.utils';

const RevenuePage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
  const t = useTranslations();
  const { user } = useAuth();
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
  const [chargesLoading, setChargesLoading] = useState<boolean>(false);
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
            // status: 'paid',
            // type: 'product',
            method: 'stripe',
          },
          limit: 1000,
          sort: '-date',
        },
      });
      console.log('response.data=======', response.data);
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
        }, 500); // 500ms debounce
        debounceTimeoutRef.current = timeout;
      }
    } else {
      // For other time frames, fetch immediately
      fetchCharges();
    }

    // Cleanup timeout
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [router.isReady, timeFrame, fromDate, toDate, fetchCharges]);

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

  if (!user?.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>Revenue</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="min-h-screen bg-gray-50">
          {/* Header Section */}
          <div className="bg-white ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <Heading
                    level={1}
                    className="text-2xl font-bold text-gray-900"
                  >
                    Revenue
                  </Heading>
                </div>
                <div className="flex items-center space-x-4">
                  <RevenueTimeFrameSelector
                    timeFrame={timeFrame}
                    setTimeFrame={handleTimeFrameChange}
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            €
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Revenue
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900 ">
                            {chargesLoading ? (
                              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded "></div>
                            ) : (
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(
                                charges
                                  .filter(
                                    (charge) => charge.status !== 'refunded',
                                  )
                                  .reduce((sum, charge) => {
                                    return (
                                      sum + (charge.amount?.total?.val || 0)
                                    );
                                  }, 0),
                              )
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            €
                          </span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Refunded
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {chargesLoading ? (
                              <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                            ) : (
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(
                                charges
                                  .filter(
                                    (charge) => charge.status === 'refunded',
                                  )
                                  .reduce((sum, charge) => {
                                    return (
                                      sum + (charge.amount?.total?.val || 0)
                                    );
                                  }, 0),
                              )
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Revenue Breakdown
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    {/* Events */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-sm font-medium text-foreground">
                        Events
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {chargesLoading ? (
                          <div className="animate-pulse bg-blue-200 h-6 w-16 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            charges
                              .filter((charge) => charge.status !== 'refunded')
                              .reduce(
                                (sum, charge) =>
                                  sum + (charge.amount?.event?.val || 0),
                                0,
                              ),
                          )
                        )}
                      </div>
                    </div>

                    {/* Rental */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-sm font-medium text-foreground">
                        Rental
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {chargesLoading ? (
                          <div className="animate-pulse bg-purple-200 h-6 w-16 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            charges
                              .filter((charge) => charge.status !== 'refunded')
                              .reduce(
                                (sum, charge) =>
                                  sum + (charge.amount?.rental?.val || 0),
                                0,
                              ),
                          )
                        )}
                      </div>
                    </div>

                    {/* Food */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-sm font-medium text-foreground">
                        Food
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {chargesLoading ? (
                          <div className="animate-pulse bg-orange-200 h-6 w-16 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            charges
                              .filter((charge) => charge.status !== 'refunded')
                              .reduce(
                                (sum, charge) =>
                                  sum + (charge.amount?.food?.val || 0),
                                0,
                              ),
                          )
                        )}
                      </div>
                    </div>

                    {/* Utilities */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-sm font-medium text-foreground">
                        Utilities
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {chargesLoading ? (
                          <div className="animate-pulse bg-cyan-200 h-6 w-16 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            charges
                              .filter((charge) => charge.status !== 'refunded')
                              .reduce(
                                (sum, charge) =>
                                  sum + (charge.amount?.utilities?.val || 0),
                                0,
                              ),
                          )
                        )}
                      </div>
                    </div>

                    {/* Connect Fee */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-sm font-medium text-foreground">
                        Connect Fee
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {chargesLoading ? (
                          <div className="animate-pulse bg-indigo-200 h-6 w-16 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            charges
                              .filter((charge) => charge.status !== 'refunded')
                              .reduce(
                                (sum, charge) =>
                                  sum + (charge.meta?.stripeConnectFee || 0),
                                0,
                              ),
                          )
                        )}
                      </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-sm font-medium text-foreground">
                        Subscriptions
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {chargesLoading ? (
                          <div className="animate-pulse bg-pink-200 h-6 w-16 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            charges
                              .filter(
                                (charge) =>
                                  charge.status !== 'refunded' &&
                                  charge.type === 'subscription',
                              )
                              .reduce(
                                (sum, charge) =>
                                  sum + (charge.amount?.total?.val || 0),
                                0,
                              ),
                          )
                        )}
                      </div>
                    </div>

                    {/* Refunds */}
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-sm font-medium text-foreground">
                        Refunds
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {chargesLoading ? (
                          <div className="animate-pulse bg-red-200 h-6 w-16 rounded"></div>
                        ) : (
                          new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(
                            charges
                              .filter((charge) => charge.status === 'refunded')
                              .reduce(
                                (sum, charge) =>
                                  sum + (charge.amount?.total?.val || 0),
                                0,
                              ),
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ChargesTable charges={charges} loading={chargesLoading} />
            </div>
          </div>
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
