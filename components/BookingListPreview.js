
import React from 'react';
import dayjs from 'dayjs';
import { __, priceFormat } from '../utils/helpers';

const BookingListPreview = ({ booking, listingName }) => {
  if (!booking || !listingName) {
    return null;
  }
  const start = dayjs(booking.get('start'));
  const end = dayjs(booking.get('end'));
  const id = booking.get('_id')
  const created = booking.get('created')
  const price = booking.get('price')
  const createdFormatted = dayjs(created).format('DD/MM/YYYY - hh:mmA')

  return (
    <div className="bg-white rounded-lg p-4 shadow-xl mb-8">
      <p className='text-xs leading-5 opacity-50 mb-3'>{ __('bookings_id')}{`${id} - ${createdFormatted}`}</p>
      <div className="mb-3">
        <p className='text-xs leading-5 opacity-50'>{ __('bookings_status') }</p>
        <p>{booking.get('status')}</p>
      </div>
      <div className="mb-3">
        <p className='text-xs leading-5 opacity-50'>{ __('bookings_checkin') }</p>
        <p>{start.format('DD/MM/YYYY')}</p>
      </div>
      <div className="mb-3">
        <p className='text-xs leading-5 opacity-50'>{ __('bookings_checkout') }</p>
        <p>{end.format('DD/MM/YYYY')}</p>
      </div>
      <div className="mb-3">
        <p className='text-xs leading-5 opacity-50'>{ __('listings_book_accomodation_type') }</p>
        <p>{listingName}</p>
      </div>
      <div className="mb-3">
        <p className='text-xs leading-5 opacity-50'>{ __('bookings_payment_accomodation') }</p>
        <p>{priceFormat(price)}</p>
      </div>
      <div className="mb-3">
        <p className='text-xs leading-5 opacity-50'>{ __('bookings_payment_utility') }</p>
        <p>NOT IMPLEMENTED</p>
      </div>
    </div>
  );
};

export default BookingListPreview;
