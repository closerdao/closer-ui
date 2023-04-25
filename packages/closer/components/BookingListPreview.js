import Link from 'next/link';

import dayjs from 'dayjs';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { __, getBookingType, priceFormat } from '../utils/helpers';

const getStatusText = (status, updated) => {
  if (status === 'cancelled') {
    return __('booking_status_cancelled', dayjs(updated).format('DD/MM/YYYY'));
  }
  const statusText = {
    rejected: __('booking_status_rejected'),
    open: __('booking_status_open'),
    pending: __('booking_status_pending'),

    confirmed: __('booking_status_confirmed'),
    paid: __('booking_status_paid'),

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
  paid: 'text-success',
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
    eventId,
    volunteerId,
  } = bookingMapItem.toJS();
  const { user } = useAuth();
  const { platform } = usePlatform();
  const startFormatted = dayjs(start).format('DD/MM/YYYY');
  const endFormatted = dayjs(end).format('DD/MM/YYYY');
  const createdFormatted = dayjs(created).format('DD/MM/YYYY - HH:mm:A');
  const isNotPaid = status === 'open';

  const bookingType = getBookingType(eventId, volunteerId);

  const isBookingCancelable =
    createdBy === user._id &&
    (status === 'open' || status === 'pending' || status === 'confirmed');

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
  };

  return (
    <div className="max-w-sm bg-white rounded-lg p-4 shadow-xl flex flex-col md:basis-5/12 md:flex-1 w-full">
      <div className="flex flex-col gap-3">
        <div>
          <p className="card-feature">
            {__('booking_card_id')}
            {_id}
          </p>
          <p className="card-feature">{createdFormatted}</p>
        </div>
        <div>
          <p className="card-feature">{__('booking_card_booking_type')}</p>
          <p>{bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}</p>
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
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {status === 'checked-in' && (
          <Link passHref href="">
            <button className="btn w-full uppercase ">
              {__('booking_card_join_chat_button')}
            </button>
          </Link>
        )}
        {status === 'checked-out' && (
          <Link passHref href="">
            <button className="btn w-full uppercase ">
              {__('booking_card_feedback_button')}
            </button>
          </Link>
        )}
        {status === 'open' && (
          <Link passHref href={`/bookings/${_id}/summary`}>
            <button className="btn w-full uppercase ">
              {__('booking_card_checkout_button')}
            </button>
          </Link>
        )}
        {status === 'confirmed' && (
          <Link passHref href={`/bookings/${_id}/checkout`}>
            <button className="btn w-full uppercase ">
              {__('booking_card_checkout_button')}
            </button>
          </Link>
        )}
        {user && isBookingCancelable && (
          <Link passHref href={`/bookings/${_id}/cancel`}>
            <button className="btn w-full uppercase">
              {__('booking_cancel_button')}
            </button>
          </Link>
        )}

        {status === 'paid' && (
          <Link passHref href={`/bookings/${_id}/cancel`}>
            <button className="btn w-full uppercase">
              {__('booking_cancel_button')}
            </button>
          </Link>
        )}

        {user &&
          user.roles.includes('space-host') &&
          createdBy !== user._id && (
            <>
              {status === 'pending' && (
                <button
                  className="btn w-full uppercase"
                  onClick={(e) => confirmBooking(e)}
                >
                  {__('booking_confirm_button')}
                </button>
              )}
              {status === 'pending' && (
                <button
                  className="btn w-full uppercase"
                  onClick={(e) => rejectBooking(e)}
                >
                  {__('booking_reject_button')}
                </button>
              )}
              <Link passHref href={`/members/${createdBy}`}>
                <button className="btn w-full uppercase">
                  {__('booking_view_profile')}
                </button>
              </Link>
            </>
          )}
      </div>
    </div>
  );
};

export default BookingListPreview;
