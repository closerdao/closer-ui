import React, { useState } from 'react';
import Link from 'next/link'
import dayjs from 'dayjs';
import { __, priceFormat } from '../utils/helpers';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';

const BookingListPreview = ({ booking }) => {
  const { user } = useAuth();
  const { platform } = usePlatform();
  const now = dayjs();
  const start = dayjs(booking.get('start'));
  const end = dayjs(booking.get('end'));
  const isBookingCancelable = now.isBefore(start);
  const [showActions, setShowActions] = useState(true);

  const confirmBooking = async (e) => {
    await platform.bookings.confirm(booking.get('_id'));
  };
  const rejectBooking = async (e) => {
    await platform.bookings.reject(booking.get('_id'));
  };

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
        {__('bookings_id')} <b>{booking.get('_id')}</b>
      </p>
      {booking.get('description') && (
        <p>
          {booking.get('description').slice(0, 120)}
          {booking.get('description').length > 120 && '...'}
        </p>
      )}
      <div className="my-2">
        { user && user._id === booking.get('createdBy') && (
          <Link passHref href={`/bookings/${booking.get('_id')}/cancel`}>
            <a>
              <button disabled={!isBookingCancelable} className="btn disabled:text-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed">
                {__('booking_cancel_button')}
              </button>
            </a>
          </Link>
        ) }
        { user && user.roles.includes('space-host') && booking.get('createdBy') !== user._id && (
          <>
            { booking.get('status') === 'pending' && (
              <button className="btn w-full mb-2 text-center" onClick={ e => confirmBooking(e) }>
                {__('booking_confirm_button')}
              </button>
            ) }
            { booking.get('status') === 'pending' && (
              <button className="btn w-full mb-2 text-center" onClick={ e => rejectBooking(e) }>
                {__('booking_reject_button')}
              </button>
            ) }
            <Link passHref href={`/members/${booking.get('createdBy')}`}>
              <a className="btn w-full text-center">
                {__('booking_view_profile')}
              </a>
            </Link>
          </>
        ) }
      </div>
    </div>
  );
};

export default BookingListPreview;
