import Head from 'next/head';
import Link from 'next/link';

import { ReactNode, useState } from 'react';
import QRCode from 'react-qr-code';

import { Button, Card, ErrorMessage, LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import { CalendarDays, MapPin } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useConfig } from '../../../hooks/useConfig';
import type { CloserCurrencies } from '../../../types/currency';
import type { Event } from '../../../types/event';
import type { TicketWithEvent } from '../../../types/ticket';
import api, { cdn } from '../../../utils/api';
import { getBearerAuthHeaders } from '../../../utils/authHeaders.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { buildEventCheckoutHref } from '../../../utils/eventCheckout';
import { priceFormat } from '../../../utils/helpers';
import { cancelTicket } from '../../../utils/tickets.api';
import { getTicketPriceBreakdown } from '../../../utils/tickets.helpers';
import PageNotFound from '../../not-found';

/** The report-trimmed event, plus whatever the full event lookup added. */
type TicketEvent = TicketWithEvent['event'] & Partial<Event>;

type Props = Omit<Partial<TicketWithEvent>, 'event'> & {
  event?: TicketEvent;
  error?: string;
};

const STATUS_TONE: Record<string, string> = {
  approved: 'bg-success/10 text-success',
  pending: 'bg-accent-light text-accent',
  'pending-payment': 'bg-accent-light text-accent',
  cancelled: 'bg-neutral text-gray-500',
  refunded: 'bg-neutral text-gray-500',
};

/** Statuses that still owe money — the ticket exists, the payment does not. */
const AWAITS_PAYMENT = ['pending', 'pending-payment'];

const Detail = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-gray-400">
      {label}
    </p>
    <div className="text-sm font-medium text-gray-900 break-words">
      {children}
    </div>
  </div>
);

/**
 * A ticket, as its holder and the host at the door see it: the event it lets
 * you into, what it cost, and the QR code the host scans. The QR points back
 * at this page, which is what `GET /tickets/:id` is for.
 */
const Ticket = ({ ticket, event, refundQuote, error }: Props) => {
  const t = useTranslations();
  const config = useConfig();

  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);

  if (!currentTicket || !event) {
    return <PageNotFound error={error} />;
  }

  const isCancelled = ['cancelled', 'refunded'].includes(currentTicket.status);
  const price = getTicketPriceBreakdown(currentTicket);
  const currency = price.currency as CloserCurrencies;
  const start = event.start && dayjs(event.start);
  const end = event.end && dayjs(event.end);

  const handleCancel = async () => {
    setCancelError(null);
    setIsCancelling(true);
    try {
      const result = await cancelTicket(currentTicket._id);
      setCurrentTicket(result.ticket);
      // The ticket always cancels; whether money came back is a separate
      // question, and the refund status is the only honest answer to it.
      setCancelNotice(
        t(`ticket_cancel_refund_${result.refund?.status || 'noop'}`),
      );
    } catch (err) {
      setCancelError(parseMessageFromError(err));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`${t('tickets_slug_title')} - ${event.name}`}</title>
        <meta property="og:type" content="ticket" />
      </Head>
      <main className="main-content flex flex-col items-center w-full max-w-xl mx-auto">
        {/* The stamp: photo on top, details below, perforation between the
            body and the QR stub the way a torn-off ticket reads. */}
        <div
          className={`w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 ${
            isCancelled ? 'opacity-60' : ''
          }`}
        >
          {event.photo && (
            <Link
              href={`/events/${event.slug}`}
              className="block h-40 sm:h-48 w-full overflow-hidden"
            >
              <img
                src={`${cdn}${event.photo}-place-lg.jpg`}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </Link>
          )}

          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <i className="text-sm text-gray-500">
                  {t('tickets_slug_subtitle')}
                </i>
                <Heading level={2} className="text-2xl mt-1">
                  <Link href={`/events/${event.slug}`}>{event.name}</Link>
                </Heading>
              </div>
              <span
                className={`shrink-0 text-xs uppercase rounded-full px-3 py-1 ${
                  STATUS_TONE[currentTicket.status] || 'bg-neutral'
                }`}
              >
                {t(`ticket_status_${currentTicket.status}`)}
              </span>
            </div>

            <div className="flex flex-col gap-2 text-sm text-gray-600">
              {start && (
                <div className="flex gap-2 items-center">
                  <CalendarDays className="w-4 h-4 shrink-0 opacity-60" />
                  <span>
                    {start.format('MMM D, YYYY HH:mm')}
                    {end && ` – ${end.format('MMM D, YYYY HH:mm')}`}
                  </span>
                </div>
              )}
              {(event.address || event.location) && (
                <div className="flex gap-2 items-center">
                  <MapPin className="w-4 h-4 shrink-0 opacity-60" />
                  <span className="truncate">
                    {event.address || event.location}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-dashed border-gray-200 pt-4">
              <Detail label={t('tickets_slug_holder')}>
                {currentTicket.name}
              </Detail>
              <Detail label={t('ticket_list_quantity')}>
                {price.quantity}
              </Detail>
              {currentTicket.option?.name && (
                <Detail label={t('event_report_ticket_option')}>
                  {currentTicket.option.name}
                </Detail>
              )}
              {currentTicket.paymentMethod && (
                <Detail label={t('event_report_payment_method')}>
                  {t(`ticket_payment_method_${currentTicket.paymentMethod}`)}
                </Detail>
              )}
              {currentTicket.used && (
                <Detail label={t('ticket_list_checked_in')}>
                  {dayjs(currentTicket.used).format('MMM D, YYYY HH:mm')}
                </Detail>
              )}
            </div>

            {/* What was charged, next to what it would have been — a
                discounted ticket showing one bare number reads as if the
                discount never applied. */}
            {price.total > 0 || price.hasDiscount ? (
              <div className="flex flex-col gap-1 text-sm border-t border-dashed border-gray-200 pt-4">
                {price.quantity > 1 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      {t('ticket_list_unit_price')}
                    </span>
                    <span>{priceFormat(price.unitPrice, currency)}</span>
                  </div>
                )}
                {price.hasDiscount && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        {t('ticket_list_list_price')}
                      </span>
                      <span className="text-gray-400 line-through">
                        {priceFormat(price.listTotal, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        {price.discountCode
                          ? t('ticket_list_discount_with_code', {
                              code: price.discountCode,
                            })
                          : t('ticket_list_discount')}
                      </span>
                      <span className="text-success">
                        -{priceFormat(price.savings, currency)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-4 font-bold">
                  <span>{t('ticket_list_total_cost')}</span>
                  <span>{priceFormat(price.total, currency)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 border-t border-dashed border-gray-200 pt-4">
                {t('ticket_free_admission')}
              </p>
            )}

            {currentTicket.fields && currentTicket.fields.length > 0 && (
              <div className="border-t border-dashed border-gray-200 pt-4 text-sm">
                {currentTicket.fields.map((field, index) => (
                  <div
                    key={field.name || index}
                    className="flex justify-between gap-4 py-1"
                  >
                    <span className="text-gray-500">{field.name}</span>
                    <span className="font-medium">{field.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* The stub. Notches sit on the tear line so the QR reads as the
              part the host keeps. */}
          <div className="relative bg-neutral border-t-2 border-dashed border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-6">
            <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-background" />
            <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-background" />
            <div className="bg-white p-3 rounded-lg shrink-0">
              <QRCode
                value={`${config.SEMANTIC_URL}/tickets/${currentTicket._id}`}
                size={128}
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase tracking-wider text-gray-400">
                {t('tickets_slug_number')}
              </p>
              <p className="font-mono text-sm break-all">{currentTicket._id}</p>
              <p className="text-xs text-gray-500 mt-2">
                {t('ticket_scan_at_door')}
              </p>
            </div>
          </div>
        </div>

        {/* A held seat that was never paid for. The event page owns checkout,
            so the link hands the ticket back to it rather than rebuilding the
            payment form here. */}
        {AWAITS_PAYMENT.includes(currentTicket.status) && event.slug && (
          <Card className="bg-white mt-6 w-full">
            <p className="text-sm text-gray-600">
              {t('ticket_awaiting_payment_notice')}
            </p>
            <LinkButton
              className="mt-3"
              href={buildEventCheckoutHref(event.slug, {
                ticketId: currentTicket._id,
              })}
            >
              {t('event_ticket_complete_payment')}
            </LinkButton>
          </Card>
        )}

        {/* A ticket bought with a stay has no refundQuote — the stay owns the
            money, and it is the stay that has to be cancelled. */}
        {refundQuote && !isCancelled && (
          <Card className="bg-white mt-6 w-full">
            <p className="text-sm text-gray-600">
              {refundQuote.refundVal > 0
                ? t('ticket_cancel_refund_quote', {
                    amount: priceFormat(
                      refundQuote.refundVal,
                      refundQuote.cur as CloserCurrencies,
                    ),
                  })
                : t('ticket_cancel_no_refund')}
            </p>
            {/* The organiser's own wording, if they wrote any — the quote above
                is the number, this is the reasoning behind it. */}
            {event.cancellationPolicyDisclaimer && (
              <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">
                {event.cancellationPolicyDisclaimer}
              </p>
            )}
            <Button
              variant="secondary"
              className="mt-3"
              onClick={handleCancel}
              isEnabled={!isCancelling}
              isLoading={isCancelling}
            >
              {t('ticket_cancel_button')}
            </Button>
          </Card>
        )}

        {currentTicket.booking && (
          <Link
            href={`/stay/${currentTicket.booking}`}
            className="mt-6 text-sm text-accent underline"
          >
            {t('ticket_list_view_booking')}
          </Link>
        )}

        {cancelNotice && (
          <p className="mt-4 text-sm text-gray-600" role="status">
            {cancelNotice}
          </p>
        )}
        {cancelError && (
          <div className="mt-4 w-full">
            <ErrorMessage error={cancelError} />
          </div>
        )}
      </main>
    </>
  );
};

Ticket.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  const headers = getBearerAuthHeaders(req as NextApiRequest);
  try {
    const { data } = await api.get(`/tickets/${query.slug}`, { headers });
    const results = data?.results || {};

    // The ticket read returns a trimmed event — enough to name it, but without
    // the photo or the address the stamp is built around.
    const eventId = results.event?._id;
    const fullEvent = eventId
      ? await api
          .get(`/event/${eventId}`, { headers })
          .then((res) => res?.data?.results)
          .catch(() => null)
      : null;

    return {
      ...results,
      event: fullEvent ? { ...results.event, ...fullEvent } : results.event,
    };
  } catch (err) {
    return { error: parseMessageFromError(err) };
  }
};

export default Ticket;
