import Link from 'next/link';

import React from 'react';

import { priceFormat } from '../utils/helpers';
import { __ } from '../utils/helpers';

const TicketListPreview = ({ ticket }) => {
  if (!ticket) {
    return null;
  }

  return (
    <div className="ticket-list-preview card">
      <div className="card-body">
        <p>
          {__('ticket_list_id')} <b>{ticket.get('_id')}</b>
        </p>
        {ticket.get('name') && (
          <p>
            {__('ticket_list_holder')} <b>{ticket.get('name')}</b>
          </p>
        )}
        {ticket.get('price') && (
          <p>
            {__('ticket_list_total_cost')}{' '}
            <b>{priceFormat(ticket.get('price'))}</b>
          </p>
        )}
        {ticket.get('option') && (
          <p>
            {__('ticket_list_type')} <b>{ticket.getIn(['option', 'name'])}</b>
          </p>
        )}
        {ticket.get('fields') &&
          ticket.get('fields').map((field, i) => (
            <p key={field._id || field.id || i}>
              {field.get('name')}: <b>{field.get('value')}</b>
            </p>
          ))}
      </div>
      <div className="card-footer">
        <Link href={`/tickets/${ticket.get('_id')}`} className="btn">
          {__('ticket_list_view_ticket')}
        </Link>
      </div>
    </div>
  );
};

export default TicketListPreview;
