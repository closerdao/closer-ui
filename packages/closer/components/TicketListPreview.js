import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { priceFormat } from '../utils/helpers';

const TicketListPreview = ({ ticket }) => {
  const t = useTranslations();
  if (!ticket) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
              {t('ticket_list_id')}
            </p>
            <p className="text-sm font-mono text-gray-900 truncate" title={ticket.get('_id')}>
              {ticket.get('_id')}
            </p>
          </div>
          {ticket.get('option') && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                {t('ticket_list_type')}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {ticket.getIn(['option', 'name'])}
              </p>
            </div>
          )}
          {ticket.get('name') && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                {t('ticket_list_holder')}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {ticket.get('name')}
              </p>
            </div>
          )}
          {ticket.get('price') && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                {t('ticket_list_total_cost')}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {priceFormat(ticket.get('price'))}
              </p>
            </div>
          )}
        </div>
        {ticket.get('fields') &&
          (ticket.get('fields').size ?? ticket.get('fields').length ?? 0) > 0 && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              {ticket.get('fields').map((field, i) => (
                <div
                  key={field.get?.('_id') || field.get?.('id') || field?._id || field?.id || i}
                  className="flex justify-between gap-4 py-1 text-sm"
                >
                  <span className="text-gray-500">{field.get?.('name') ?? field?.name}</span>
                  <span className="font-medium text-gray-900">{field.get?.('value') ?? field?.value}</span>
                </div>
              ))}
            </div>
          )}
      </div>
      <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
        <Link
          href={`/tickets/${ticket.get('_id')}`}
          className="flex-1 sm:flex-initial text-center px-4 py-2 text-sm font-medium text-accent hover:text-accent-dark border border-accent rounded-lg hover:bg-accent/5 transition-colors"
        >
          {t('ticket_list_view_ticket')}
        </Link>
        <Link
          href={`/bookings/${ticket.get('booking')}`}
          className="flex-1 sm:flex-initial text-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('ticket_list_view_booking')}
        </Link>
      </div>
    </div>
  );
};

export default TicketListPreview;
