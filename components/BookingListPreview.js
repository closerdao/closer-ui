import React from 'react';
import Link from 'next/link'
import dayjs from 'dayjs';
import { __, priceFormat } from '../utils/helpers';

const BookingListPreview = ({ booking }) => {
  const start = dayjs(booking.get('start'));
  const end = dayjs(booking.get('end'));
  const bookingId = booking.get('_id')
  return (
    <div className="booking-list-preview card mb-4 last:mb-0 md:w-fit">
      <p>
        {__('bookings_status')} <b>{booking.get('status')}</b>
      </p>
      <p>
        {__('bookings_checkin')} <b>{start.format('LLL')}</b>
      </p>
      <p>
        {__('bookings_checkout')} <b>{end.format('LLL')}</b>
      </p>
      <p>
        {__('bookings_total')}
        <b className={booking.get('volunteer') ? 'line-through' : ''}>
          {' '}
          {priceFormat(booking.get('price'))}
        </b>
        <b>
          {' '}
          {booking.get('volunteer') &&
            priceFormat(0, booking.getIn(['price', 'cur']))}
        </b>
      </p>
      <p>
        {__('bookings_id')} <b>{bookingId}</b>
      </p>
      {booking.get('description') && (
        <p>
          {booking.get('description').slice(0, 120)}
          {booking.get('description').length > 120 && '...'}
        </p>
      )}
      <div className="my-2">
        <Link passHref href={`/bookings/${bookingId}/cancel`}>
          <a className="btn">
            {__('booking_cancel_button')}
          </a>
        </Link>
      </div>
    </div>
  );
};

export default BookingListPreview;
