
import React from 'react';
import Link from 'next/link'
import dayjs from 'dayjs';
import { __, priceFormat } from '../utils/helpers';

const BookingListPreview = ({ booking }) => {
  const bookingId = booking.get('_id')
  const now = dayjs();
  const start = dayjs(booking.get('start'));
  const end = dayjs(booking.get('end'));
  const isBookingCancelable = now.isBefore(start);

  return (
    <div className="bg-white rounded-lg p-4 shadow-xl mb-8">
      <p className='text-xs leading-5 opacity-50 mb-3'>
        {__('bookings_status')} <b className="tag">{booking.get('status')}</b>
      </p>
      <p className='text-xs leading-5 opacity-50 mb-3'>
        {__('bookings_checkin')} <b>{start.format('LLL')}</b>
      </p>
      <p className='text-xs leading-5 opacity-50 mb-3'>
        {__('bookings_checkout')} <b>{end.format('LLL')}</b>
      </p>
      <p className='text-xs leading-5 opacity-50 mb-3'>
        {__('bookings_total')}
        <b>
          {priceFormat(booking.get('total') || booking.get('utilityFiat'))}
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
          <a>
            <button disabled={!isBookingCancelable} className="btn disabled:text-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed">
              {__('booking_cancel_button')}
            </button>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default BookingListPreview;
