import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { priceFormat } from '../utils/helpers';

const TicketListPreview = ({ ticket }) => {
  const t = useTranslations();
  if (!ticket) {
    return null;
  }

  return (
    <div className="ticket-list-preview card">
      <div className="card-body">
        <p>
          {t('ticket_list_id')} <b>{ticket.get('_id')}</b>
        </p>
        {ticket.get('name') && (
          <p>
            {t('ticket_list_holder')} <b>{ticket.get('name')}</b>
          </p>
        )}
        {ticket.get('price') && (
          <p>
            {t('ticket_list_total_cost')}{' '}
            <b>{priceFormat(ticket.get('price'))}</b>
          </p>
        )}
        {ticket.get('option') && (
          <p>
            {t('ticket_list_type')} <b>{ticket.getIn(['option', 'name'])}</b>
          </p>
        )}
        {ticket.get('fields') &&
          ticket.get('fields').map((field, i) => (
            <p key={field._id || field.id || i}>
              {field.get('name')}: <b>{field.get('value')}</b>
            </p>
          ))}
      </div>
      <div className="card-footer gap-2 flex">
        <Link href={`/tickets/${ticket.get('_id')}`} className="btn">
          {t('ticket_list_view_ticket')}
        </Link>
        <Link href={`/bookings/${ticket.get('booking')}`} className="btn">
          {t('ticket_list_view_booking')}
        </Link>
      </div>
    </div>
  );
};

export default TicketListPreview;
