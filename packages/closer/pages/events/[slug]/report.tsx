import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';

import { Card, Heading, Spinner } from '../../../components/ui';

import dayjs from 'dayjs';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useConfig } from '../../../hooks/useConfig';
import type { CloserCurrencies } from '../../../types/currency';
import type {
  EventReport as EventReportData,
  EventReportSlice,
} from '../../../types/eventReport';
import api from '../../../utils/api';
import { getBearerAuthHeaders } from '../../../utils/authHeaders.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { priceFormat } from '../../../utils/helpers';
import PageNotFound from '../../not-found';

const DonutChart = dynamic(
  () => import('../../../components/ui/Charts/DonutChart'),
  {
    ssr: false,
    loading: () => <Spinner />,
  },
);

const OBJECT_ID = /^[a-f\d]{24}$/i;

interface Props {
  report?: EventReportData | null;
  /** Slug we navigated with, so the back link works even without a report. */
  eventSlug?: string | null;
  error?: string;
  errorStatus?: number;
}

/** "checked-in" -> "Checked in" — the API's statuses are already readable. */
const formatStatus = (status: string) =>
  `${status.charAt(0).toUpperCase()}${status.slice(1)}`.replace(/-/g, ' ');

const StatusList = ({
  byStatus,
  emptyLabel,
}: {
  byStatus: Record<string, number>;
  emptyLabel: string;
}) => {
  const entries = Object.entries(byStatus || {}).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {entries.map(([status, count]) => (
        <li key={status} className="flex justify-between text-sm">
          <span className="text-gray-600">{formatStatus(status)}</span>
          <span className="font-bold">{count}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * `byOption` and `byPaymentMethod` are the same counted seats cut two ways, so
 * they render identically — and the revenue column of each adds up to the
 * event revenue headline.
 */
const SliceTable = ({
  slices,
  nameLabel,
  money,
  labels,
}: {
  slices: EventReportSlice[];
  nameLabel: string;
  money: (value: number) => string;
  labels: { count: string; attendees: string; revenue: string };
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2 pr-2 font-medium">{nameLabel}</th>
          <th className="py-2 px-2 font-medium text-right">{labels.count}</th>
          <th className="py-2 px-2 font-medium text-right">
            {labels.attendees}
          </th>
          <th className="py-2 pl-2 font-medium text-right">{labels.revenue}</th>
        </tr>
      </thead>
      <tbody>
        {slices.map((slice) => (
          <tr key={slice.name} className="border-b last:border-b-0">
            <td className="py-2 pr-2">{formatStatus(slice.name)}</td>
            <td className="py-2 px-2 text-right">{slice.count}</td>
            <td className="py-2 px-2 text-right">{slice.attendees}</td>
            <td className="py-2 pl-2 text-right">{money(slice.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <Card className="bg-white">
    <div className="flex flex-col gap-1">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  </Card>
);

const EventReport = ({ report, eventSlug, error, errorStatus }: Props) => {
  const t = useTranslations();
  const { payment } = useConfig() || {};
  const vatRate = Number(payment?.vatRate) || 0.23;

  if (errorStatus === 404) {
    return <PageNotFound error={error} />;
  }

  // The API answers "sign in" and "you may not see this" with the same status;
  // the message is what separates them, and PageNotAllowed shows it.
  if (errorStatus === 401 || errorStatus === 403) {
    return <PageNotAllowed error={error} />;
  }

  if (!report) {
    return <PageNotFound error={error} />;
  }

  const {
    event,
    currency,
    mixedCurrencies,
    currencies,
    totals,
    bookings,
    tickets,
    attendance,
    byOption,
    byPaymentMethod,
  } = report;

  // The report resolves one currency for the whole payload; it is any ISO code
  // the platform took money in, which is wider than the CloserCurrencies enum.
  const money = (value: number) =>
    priceFormat(value, currency as CloserCurrencies);

  const sliceLabels = {
    count: t('total_tickets_sold'),
    attendees: t('event_report_attendees'),
    revenue: t('total_event_revenue'),
  };

  const start = event?.start && dayjs(event.start);
  const end = event?.end && dayjs(event.end);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMM D' : 'YYYY MMMM';
  const nights = start && end ? Math.max(1, end.diff(start, 'day') + 1) : 1;

  // Prices across the platform are VAT-inclusive (see getVatInfo), so VAT is
  // carved out of the event revenue rather than added on top of it.
  const vatAmount = (totals.eventRevenue * vatRate) / (1 + vatRate);
  const earningsAfterVAT = totals.eventRevenue - vatAmount;

  const isEmpty = totals.ticketsSold === 0;

  const revenueByCategory = [
    { name: t('event_report_event_revenue'), value: totals.eventRevenue },
    { name: t('event_report_rental_revenue'), value: bookings.rentalRevenue },
    { name: t('event_report_utility_revenue'), value: bookings.utilityRevenue },
    { name: t('event_report_food_revenue'), value: bookings.foodRevenue },
  ].filter((slice) => slice.value > 0);

  const attendeesBySource = [
    { name: t('event_report_from_bookings'), value: bookings.attendees },
    { name: t('event_report_from_tickets'), value: tickets.attendees },
  ].filter((slice) => slice.value > 0);

  const backSlug = event?.slug || eventSlug;

  return (
    <>
      <Head>
        <title>{`${event.name} - ${t('event_report')}`}</title>
      </Head>
      <main className="main-content w-full">
        {backSlug && (
          <div className="mb-6">
            <Link
              href={`/events/${backSlug}`}
              className="flex items-center text-accent hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('back_to_event')}
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div>
            <Heading level={1}>
              {event.name} - {t('event_report')}
            </Heading>
            <p className="text-gray-600">
              {start && start.format(dateFormat)}
              {end && ` - ${end.format(dateFormat)}`}
            </p>
          </div>

          {mixedCurrencies && (
            <div className="flex gap-3 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <TriangleAlert className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">
                  {t('event_report_mixed_currencies_title')}
                </p>
                <p>
                  {t('event_report_mixed_currencies_body', {
                    currencies: currencies.join(', '),
                  })}
                </p>
              </div>
            </div>
          )}

          {isEmpty ? (
            <Card className="bg-white">
              <p className="text-gray-600">{t('event_report_no_activity')}</p>
            </Card>
          ) : (
            <>
              {/* Headline — the merged view of both doors money comes in by. */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label={t('total_revenue')}
                  value={
                    mixedCurrencies
                      ? currencies.join(' / ')
                      : money(totals.totalRevenue)
                  }
                  hint={t('event_report_total_revenue_hint')}
                />
                <StatCard
                  label={t('total_event_revenue')}
                  value={money(totals.eventRevenue)}
                  hint={t('event_report_event_revenue_hint')}
                />
                <StatCard
                  label={t('event_report_stay_revenue')}
                  value={money(totals.stayRevenue)}
                  hint={t('event_report_stay_revenue_hint')}
                />
                <StatCard
                  label={t('total_tickets_sold')}
                  value={totals.ticketsSold}
                  hint={t('event_report_tickets_sold_hint')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label={t('event_report_attendees')}
                  value={
                    event.capacity
                      ? `${totals.attendees} / ${event.capacity}`
                      : totals.attendees
                  }
                  hint={t('event_report_attendees_hint')}
                />
                {attendance && (
                  <StatCard
                    label={t('event_report_seats_remaining')}
                    value={
                      attendance.remaining === null
                        ? t('event_report_unlimited')
                        : attendance.remaining
                    }
                    hint={t('event_report_seats_remaining_hint', {
                      held: attendance.held,
                    })}
                  />
                )}
                <StatCard
                  label={t('event_report_revenue_per_attendee')}
                  value={money(
                    totals.attendees > 0
                      ? totals.totalRevenue / totals.attendees
                      : 0,
                  )}
                />
                <StatCard
                  label={t('revenue_per_day')}
                  value={money(totals.totalRevenue / nights)}
                />
                <StatCard
                  label={t('average_ticket_price')}
                  value={money(
                    totals.ticketsSold > 0
                      ? totals.eventRevenue / totals.ticketsSold
                      : 0,
                  )}
                />
              </div>

              {/* Where it came from — bookings and standalone tickets split. */}
              <div>
                <Heading level={2}>{t('event_report_sources')}</Heading>
                <p className="text-sm text-gray-500 mt-1">
                  {t('event_report_sources_description')}
                </p>
                <Card className="bg-white mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2 pr-2 font-medium">
                          {t('event_report_source')}
                        </th>
                        <th className="py-2 px-2 font-medium text-right">
                          {t('total_tickets_sold')}
                        </th>
                        <th className="py-2 px-2 font-medium text-right">
                          {t('event_report_attendees')}
                        </th>
                        <th className="py-2 px-2 font-medium text-right">
                          {t('total_event_revenue')}
                        </th>
                        <th className="py-2 px-2 font-medium text-right">
                          {t('event_report_stay_revenue')}
                        </th>
                        <th className="py-2 pl-2 font-medium text-right">
                          {t('total_revenue')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 pr-2">
                          {t('event_report_from_bookings')}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {bookings.count}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {bookings.attendees}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {money(bookings.eventRevenue)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {money(bookings.stayRevenue)}
                        </td>
                        <td className="py-2 pl-2 text-right">
                          {money(bookings.totalRevenue)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-2">
                          {t('event_report_from_tickets')}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {tickets.count}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {tickets.attendees}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {money(tickets.revenue)}
                        </td>
                        <td className="py-2 px-2 text-right text-gray-400">
                          —
                        </td>
                        <td className="py-2 pl-2 text-right">
                          {money(tickets.revenue)}
                        </td>
                      </tr>
                      <tr className="font-bold">
                        <td className="py-2 pr-2">{t('total_revenue')}</td>
                        <td className="py-2 px-2 text-right">
                          {totals.ticketsSold}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {totals.attendees}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {money(totals.eventRevenue)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {money(totals.stayRevenue)}
                        </td>
                        <td className="py-2 pl-2 text-right">
                          {money(totals.totalRevenue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </div>

              {/* The same seats, cut two ways: what kind, and paid how. */}
              {Boolean(byOption?.length || byPaymentMethod?.length) && (
                <div>
                  <Heading level={2}>{t('event_report_seats')}</Heading>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('event_report_seats_description')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {byOption && byOption.length > 0 && (
                      <Card className="bg-white">
                        <Heading level={3}>
                          {t('event_report_by_option')}
                        </Heading>
                        <div className="mt-4">
                          <SliceTable
                            slices={byOption}
                            nameLabel={t('event_report_ticket_option')}
                            money={money}
                            labels={sliceLabels}
                          />
                        </div>
                      </Card>
                    )}
                    {byPaymentMethod && byPaymentMethod.length > 0 && (
                      <Card className="bg-white">
                        <Heading level={3}>
                          {t('event_report_by_payment_method')}
                        </Heading>
                        <div className="mt-4">
                          <SliceTable
                            slices={byPaymentMethod}
                            nameLabel={t('event_report_payment_method')}
                            money={money}
                            labels={sliceLabels}
                          />
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Non-fiat rails are shown beside the money, never added to it. */}
              {(bookings.tokensStaked > 0 || bookings.creditsPaid > 0) && (
                <div>
                  <Heading level={2}>{t('event_report_other_rails')}</Heading>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('event_report_other_rails_description')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <StatCard
                      label={t('event_report_tokens_staked')}
                      value={bookings.tokensStaked}
                    />
                    <StatCard
                      label={t('event_report_credits_paid')}
                      value={bookings.creditsPaid}
                    />
                  </div>
                </div>
              )}

              {/* Earnings after VAT — event money only, the stay is the venue's. */}
              <div>
                <Heading level={2}>{t('earnings_report')}</Heading>
                <Card className="bg-white mt-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-700">
                        {t('total_event_revenue')}
                      </span>
                      <span className="font-bold">
                        {money(totals.eventRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-700">
                        {t('vat')} ({(vatRate * 100).toFixed(0)}%)
                      </span>
                      <span className="font-bold text-red-500">
                        -{money(vatAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-700 font-bold">
                        {t('earnings_after_vat')}
                      </span>
                      <span className="font-bold text-green-600">
                        {money(earningsAfterVAT)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {(revenueByCategory.length > 0 ||
                attendeesBySource.length > 0) && (
                <div>
                  <Heading level={2}>{t('event_report_breakdown')}</Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {revenueByCategory.length > 0 && (
                      <Card className="bg-white">
                        <Heading level={3}>
                          {t('event_report_revenue_by_category')}
                        </Heading>
                        <div className="mt-4">
                          <DonutChart
                            data={revenueByCategory}
                            isEur={currency === 'EUR'}
                          />
                        </div>
                      </Card>
                    )}
                    {attendeesBySource.length > 0 && (
                      <Card className="bg-white">
                        <Heading level={3}>
                          {t('event_report_attendees_by_source')}
                        </Heading>
                        <div className="mt-4">
                          <DonutChart data={attendeesBySource} />
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Every row for the event, so the money can be reconciled. */}
          <div>
            <Heading level={2}>{t('event_report_statuses')}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card className="bg-white">
                <Heading level={3}>
                  {t('event_report_bookings_by_status')}
                </Heading>
                <StatusList
                  byStatus={bookings.byStatus}
                  emptyLabel={t('event_report_no_bookings')}
                />
                {bookings.notCounted > 0 && (
                  <p className="text-xs text-gray-400 border-t pt-2">
                    {t('event_report_bookings_not_counted', {
                      count: bookings.notCounted,
                    })}
                  </p>
                )}
              </Card>
              <Card className="bg-white">
                <Heading level={3}>
                  {t('event_report_tickets_by_status')}
                </Heading>
                <StatusList
                  byStatus={tickets.byStatus}
                  emptyLabel={t('event_report_no_tickets')}
                />
                {/* Held seats are unavailable without having been paid for,
                    so they are named rather than left to look like a gap. */}
                {tickets.held && tickets.held.attendees > 0 && (
                  <p className="text-xs text-gray-500 border-t pt-2">
                    {t('event_report_tickets_held', {
                      count: tickets.held.count,
                      attendees: tickets.held.attendees,
                    })}
                  </p>
                )}
                {tickets.refunded && tickets.refunded.count > 0 && (
                  <p className="text-xs text-gray-500">
                    {t('event_report_tickets_refunded', {
                      count: tickets.refunded.count,
                      refunded: money(tickets.refunded.refundVal),
                    })}
                  </p>
                )}
                {tickets.linkedToBookings > 0 && (
                  <p className="text-xs text-gray-400 border-t pt-2">
                    {t('event_report_tickets_linked_to_bookings', {
                      count: tickets.linkedToBookings,
                    })}
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

EventReport.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  const headers = getBearerAuthHeaders(req as NextApiRequest);
  const slug = String(query.slug || '');

  try {
    // The report is keyed by ObjectId, the route by slug — resolve one to the
    // other unless the URL already carries an id.
    let eventId = OBJECT_ID.test(slug) ? slug : null;
    if (!eventId) {
      const eventRes = await api.get(`/event/${slug}`, { headers });
      eventId = eventRes?.data?.results?._id || null;
    }

    if (!eventId) {
      return { errorStatus: 404, eventSlug: slug };
    }

    const reportRes = await api.get(`/events/${eventId}/report`, { headers });

    return {
      report: reportRes?.data?.results || null,
      eventSlug: slug,
    };
  } catch (err: any) {
    return {
      error: parseMessageFromError(err),
      errorStatus: err?.response?.status || 500,
      eventSlug: slug,
    };
  }
};

export default EventReport;
