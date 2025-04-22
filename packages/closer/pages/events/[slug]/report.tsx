import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Card, Heading, Spinner } from '../../../components/ui';
import DonutChart from '../../../components/ui/Charts/DonutChart';

import { FaArrowLeft } from '@react-icons/all-files/fa/FaArrowLeft';
import dayjs from 'dayjs';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import PageNotAllowed from '../../401';
import PageNotFound from '../../not-found';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { formatThousands } from '../../../utils/dashboard.helpers';
import { priceFormat } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import Loading from '../../../components/Loading';

interface Props {
  event: any;
  error?: string;
}

const EventReport = ({ event, error }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user, isLoading } = useAuth();
  const { payment } = useConfig() || {};
  const vatRate = payment?.vatRate || 0.23;
  const [loading, setLoading] = useState(true);

  const ticketsFilter = event && {
    where: {
      event: event._id
    },
  };

  const bookingsFilter = event && {
    where: {
      eventId: event._id,
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
    },
  };

  const tickets = platform.ticket.find(ticketsFilter);
  const bookings = platform.booking.find(bookingsFilter);

  // Calculate total event revenue (from tickets)
  let eventRevenue = 0;
  let ticketCount = 0;
  let dayTicketCount = 0;
  const ticketTypeMap = new Map();

  tickets && tickets.forEach((ticket: any) => {
    const price = ticket.getIn(['price','val']) || 0;
    const quantity = ticket.get('quantity') || 1;
    const ticketType = ticket.getIn(['option', 'name']) || 'Standard';

    eventRevenue += price;
    ticketCount += quantity;

    // Check if it's a day ticket (based on name containing "day" or "daily")
    const isDay = ticketType.toLowerCase().includes('day');
    if (isDay) {
      dayTicketCount += quantity;
    }

    // Aggregate tickets by type
    if (ticketTypeMap.has(ticketType)) {
      ticketTypeMap.set(ticketType, {
        count: ticketTypeMap.get(ticketType).count + quantity,
        revenue: ticketTypeMap.get(ticketType).revenue + price
      });
    } else {
      ticketTypeMap.set(ticketType, { count: quantity, revenue: price });
    }
  });

  // Convert ticket type map to array for chart
  const ticketsByType = Array.from(ticketTypeMap.entries()).map(([name, data]) => ({
    name,
    value: data.count,
    revenue: data.revenue
  }));

  // Calculate total booking revenue
  let bookingRevenue = 0;
  bookings && bookings.forEach((booking: any) => {
    const total = booking.getIn(['total', 'val']) || 0;
    bookingRevenue += total;
  });


  const canViewReport = user
    ? user?._id === event?.createdBy || user?.roles.includes('admin')
    : false;


  const loadData = async () => {
    try {
      setLoading(true);
      if (event) {
        await Promise.all([
          platform.ticket.get(ticketsFilter),
          platform.booking.get(bookingsFilter),
        ]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event && canViewReport) {
      loadData();
    }
  }, [event, user, canViewReport]);

  if (isLoading) {
    return <Loading />;
  }

  if (!event) {
    return <PageNotFound error={error} />;
  }

  if (!canViewReport) {
    return <PageNotAllowed />;
  }

  // Calculate earnings after VAT
  const totalRevenue = eventRevenue + bookingRevenue;
  const vatAmount = eventRevenue * vatRate;
  const earningsAfterVAT = eventRevenue - vatAmount;

  const start = event && event.start && dayjs(event.start);
  const end = event && event.end && dayjs(event.end);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMM D' : 'YYYY MMMM';

  return (
    <>
      <Head>
        <title>{event.name} - {t('event_report')}</title>
      </Head>
      <main className="main-content w-full">
        <div className="mb-6">
          <Link href={`/events/${event.slug}`} className="flex items-center text-accent hover:underline">
            <FaArrowLeft className="mr-2" /> {t('back_to_event')}
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <Heading level={1}>{event.name} - {t('event_report')}</Heading>
              <p className="text-gray-600">
                {start && dayjs(start).format(dateFormat)}
                {end && ` - ${dayjs(end).format(dateFormat)}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="my-16 flex items-center gap-2">
              <Spinner /> {t('generic_loading')}
            </div>
          ) : (
            <>
              {/* Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">{t('total_event_revenue')}</span>
                    <span className="text-2xl font-bold">{priceFormat(eventRevenue)}</span>
                  </div>
                </Card>
                <Card className="bg-white">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">{t('total_booking_revenue')}</span>
                    <span className="text-2xl font-bold">{priceFormat(bookingRevenue)}</span>
                  </div>
                </Card>
                <Card className="bg-white">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">{t('total_tickets_sold')}</span>
                    <span className="text-2xl font-bold">{ticketCount}</span>
                  </div>
                </Card>
                <Card className="bg-white">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm">{t('day_tickets_sold')}</span>
                    <span className="text-2xl font-bold">{dayTicketCount}</span>
                  </div>
                </Card>
              </div>

              {/* Earnings Report */}
              <div className="mt-8">
                <Heading level={2}>{t('earnings_report')}</Heading>
                <Card className="bg-white mt-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-700">{t('total_ticket_sales')}</span>
                      <span className="font-bold">{priceFormat(eventRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-700">{t('vat')} ({(vatRate * 100).toFixed(0)}%)</span>
                      <span className="font-bold text-red-500">-{priceFormat(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-700 font-bold">{t('earnings_after_vat')}</span>
                      <span className="font-bold text-green-600">{priceFormat(earningsAfterVAT)}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Ticket Distribution */}
              {ticketsByType.length > 0 && (
                <div className="mt-8">
                  <Heading level={2}>{t('ticket_distribution')}</Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <Card className="bg-white">
                      <Heading level={3}>{t('tickets_by_type')}</Heading>
                      <div className="mt-4">
                        <DonutChart data={ticketsByType} />
                      </div>
                    </Card>
                    <Card className="bg-white">
                      <Heading level={3}>{t('revenue_by_ticket_type')}</Heading>
                      <div className="mt-4">
                        <DonutChart 
                          data={ticketsByType.map(type => ({
                            name: type.name,
                            value: type.revenue
                          }))} 
                          isEur={true}
                        />
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Additional Metrics */}
              <div className="mt-8">
                <Heading level={2}>{t('additional_metrics')}</Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <Card className="bg-white">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm">{t('total_revenue')}</span>
                      <span className="text-2xl font-bold">{priceFormat(totalRevenue)}</span>
                      <span className="text-sm text-gray-500 mt-2">
                        {t('combined_event_booking_revenue')}
                      </span>
                    </div>
                  </Card>
                  <Card className="bg-white">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm">{t('average_ticket_price')}</span>
                      <span className="text-2xl font-bold">
                        {ticketCount > 0 
                          ? priceFormat(eventRevenue / ticketCount) 
                          : priceFormat(0)}
                      </span>
                    </div>
                  </Card>
                  <Card className="bg-white">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm">{t('revenue_per_day')}</span>
                      <span className="text-2xl font-bold">
                        {start && end 
                          ? priceFormat(totalRevenue / (end.diff(start, 'day') + 1)) 
                          : priceFormat(0)}
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

EventReport.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [eventRes, messages] = await Promise.all([
      api
        .get(`/event/${query.slug}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        })
        .catch((err) => {
          console.error('Error fetching event:', err);
          return { data: { results: null } };
        }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    return {
      event: eventRes?.data?.results,
      messages,
    };
  } catch (err: unknown) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default EventReport;
