import Link from 'next/link';

import React from 'react';

import dayjs from 'dayjs';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { __, priceFormat } from '../utils/helpers';

const getStatusText = (status, updated) => {
  if (status === 'cancelled') {
    return __('booking_status_cancelled', dayjs(updated).format('DD/MM/YYYY'));
  }
  const statusText = {
    rejected: __('booking_status_rejected'),
    open: __('booking_status_open'),
    pending: __('booking_status_pending'),
    confirmed: __('booking_status_confirmed'),
    'checked-in': __('booking_status_checked_in'),
    'checked-out': __('booking_status_checked_out'),
  };
  return statusText[status];
};

const statusColor = {
  cancelled: 'text-failure',
  rejected: 'text-failure',
  open: 'text-pending',
  pending: 'text-pending',
  confirmed: 'text-success',
  'checked-in': 'text-success',
  'checked-out': 'text-success',
};

const BookingListPreview = ({ booking: bookingMapItem, listingName }) => {
  const {
    _id,
    start,
    end,
    status,
    created,
    createdBy,
    useTokens,
    updated,
    adults,
    rentalToken,
    rentalFiat,
    utilityFiat,
    description,
  } = bookingMapItem.toJS();
  console.log(bookingMapItem.toJS());
  const { user } = useAuth();
  const { platform } = usePlatform();
  const now = dayjs();
  const startFormatted = dayjs(start).format('DD/MM/YYYY');
  const endFormatted = dayjs(end).format('DD/MM/YYYY');
  const isBookingCancelable = now.isBefore(start);
  const createdFormatted = dayjs(created).format('DD/MM/YYYY - HH:mm:A');
  const isNotPaid = status === 'open';

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
  };

  return (
    <div className="max-w-sm bg-white rounded-lg p-4 shadow-xl flex flex-col md:basis-5/12 md:flex-1 gap-3">
      <div>
        <p className="card-feature">
          {__('booking_card_id')}
          {_id}
        </p>
        <p className="card-feature">{createdFormatted}</p>
      </div>
      <div>
        <p className="card-feature">{__('booking_card_status')}</p>
        <p
          className={`capitalize opacity-100 text-base ${statusColor[status]}`}
        >
          {status}
        </p>
      </div>
      <div>
        <p className="card-feature">{__('booking_card_message')}</p>
        <p>{getStatusText(status, updated)}</p>
      </div>
      <div>
        <p className="card-feature">{__('booking_card_guests')}</p>
        <p>{adults}</p>
      </div>
      <div>
        <p className="card-feature">{__('booking_card_checkin')}</p>
        <p>{startFormatted}</p>
      </div>
      <div>
        <p className="card-feature">{__('booking_card_checkout')}</p>
        <p>{endFormatted}</p>
      </div>
      <div>
        <p className="card-feature">{__('booking_card_type')}</p>
        <p>{listingName}</p>
      </div>
      <div>
        <p className="card-feature">
          {__('booking_card_payment_accomodation')}
        </p>
        <p>
          {useTokens ? priceFormat(rentalToken) : priceFormat(rentalFiat)}{' '}
          {isNotPaid && (
            <span className="text-failure">{__('booking_card_unpaid')}</span>
          )}
        </p>
      </div>
      <div>
        <p className="card-feature">{__('booking_card_payment_utility')}</p>
        <p>
          {priceFormat(utilityFiat)}{' '}
          {isNotPaid && (
            <span className="text-failure">{__('booking_card_unpaid')}</span>
          )}
        </p>
      </div>
      {description && (
        <p>
          {description.slice(0, 120)}
          {description.length > 120 && '...'}
        </p>
      )}
      <div className="my-2">
        {user && user._id === createdBy && (
          <Link passHref href={`/bookings/${_id}/cancel`}>
            <a>
              <button
                disabled={!isBookingCancelable}
                className="btn disabled:text-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
              >
                {__('booking_cancel_button')}
              </button>
            </a>
          </Link>
        )}
        {user &&
          user.roles.includes('space-host') &&
          createdBy !== user._id && (
            <>
              {status === 'pending' && (
                <button
                  className="btn w-full mb-2 text-center"
                  onClick={(e) => confirmBooking(e)}
                >
                  {__('booking_confirm_button')}
                </button>
              )}
              {status === 'pending' && (
                <button
                  className="btn w-full mb-2 text-center"
                  onClick={(e) => rejectBooking(e)}
                >
                  {__('booking_reject_button')}
                </button>
              )}
              <Link passHref href={`/members/${createdBy}`}>
                <a className="btn w-full text-center">
                  {__('booking_view_profile')}
                </a>
              </Link>
            </>
          )}
      </div>
    </div>
  );
};

export default BookingListPreview;
