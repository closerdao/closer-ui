import Link from 'next/link';

import { ReactNode } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import type { CloserCurrencies } from '../types/currency';
import type { Ticket } from '../types/ticket';
import { priceFormat } from '../utils/helpers';
import { getTicketPriceBreakdown } from '../utils/tickets.helpers';

interface Props {
  ticket: Ticket;
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
      {label}
    </p>
    <div className="text-sm font-medium text-gray-900">{children}</div>
  </div>
);

const STATUS_TONE: Record<string, string> = {
  approved: 'bg-success/10 text-success',
  pending: 'bg-accent-light text-accent',
  'pending-payment': 'bg-accent-light text-accent',
  cancelled: 'bg-neutral text-gray-500',
  refunded: 'bg-neutral text-gray-500',
};

/**
 * One ticket in the organiser's list. A ticket that came with a stay carries a
 * booking; a ticket sold on its own does not, so everything about the booking
 * — including the link to it — only appears when there is one.
 */
const TicketListPreview = ({ ticket }: Props) => {
  const t = useTranslations();
  if (!ticket) {
    return null;
  }

  const price = getTicketPriceBreakdown(ticket);
  const currency = price.currency as CloserCurrencies;
  const bookingId = ticket.booking;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
              {t('ticket_list_id')}
            </p>
            <p
              className="text-sm font-mono text-gray-900 truncate"
              title={ticket._id}
            >
              {ticket._id}
            </p>
          </div>
          <span
            className={`shrink-0 text-xs uppercase rounded-full px-3 py-1 ${
              STATUS_TONE[ticket.status] || 'bg-neutral'
            }`}
          >
            {t(`ticket_status_${ticket.status}`)}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {ticket.option?.name && (
            <Field label={t('ticket_list_type')}>{ticket.option.name}</Field>
          )}
          {ticket.name && (
            <Field label={t('ticket_list_holder')}>{ticket.name}</Field>
          )}
          {ticket.email && (
            <Field label={t('ticket_list_email')}>{ticket.email}</Field>
          )}
          <Field label={t('ticket_list_quantity')}>{price.quantity}</Field>
          {ticket.paymentMethod && (
            <Field label={t('event_report_payment_method')}>
              {t(`ticket_payment_method_${ticket.paymentMethod}`)}
            </Field>
          )}
          {ticket.created && (
            <Field label={t('ticket_list_purchased')}>
              {dayjs(ticket.created).format('MMM D, YYYY')}
            </Field>
          )}
          {ticket.used && (
            <Field label={t('ticket_list_checked_in')}>
              {dayjs(ticket.used).format('MMM D, YYYY HH:mm')}
            </Field>
          )}
        </div>

        {/* What was charged, next to what it would have been — a discounted
            ticket showing one bare number reads as if nothing was applied. */}
        <div className="border-t border-gray-100 pt-4 mt-4 flex flex-col gap-1 text-sm">
          {price.quantity > 1 && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                {t('ticket_list_unit_price')}
              </span>
              <span className="text-gray-900">
                {priceFormat(price.unitPrice, currency)}
              </span>
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
          <div className="flex justify-between gap-4 font-semibold text-gray-900">
            <span>{t('ticket_list_total_cost')}</span>
            <span>{priceFormat(price.total, currency)}</span>
          </div>
        </div>

        {ticket.fields && ticket.fields.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            {ticket.fields.map((field, index) => (
              <div
                key={field.name || index}
                className="flex justify-between gap-4 py-1 text-sm"
              >
                <span className="text-gray-500">{field.name}</span>
                <span className="font-medium text-gray-900">{field.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
        <Link
          href={`/tickets/${ticket._id}`}
          className="flex-1 sm:flex-initial text-center px-4 py-2 text-sm font-medium text-accent hover:text-accent-dark border border-accent rounded-lg hover:bg-accent/5 transition-colors"
        >
          {t('ticket_list_view_ticket')}
        </Link>
        {bookingId && (
          <Link
            href={`/stay/${bookingId}`}
            className="flex-1 sm:flex-initial text-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('ticket_list_view_booking')}
          </Link>
        )}
      </div>
    </div>
  );
};

export default TicketListPreview;
