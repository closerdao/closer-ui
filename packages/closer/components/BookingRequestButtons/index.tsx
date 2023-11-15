import Link from 'next/link';

import React from 'react';

import dayjs from 'dayjs';

import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';
import { Button } from '../ui';

interface Props {
  _id: string;
  status: string;
  createdBy: string;
  confirmBooking: () => void;
  start: string | Date;
  end: string | Date;
  rejectBooking: () => void;
}

const BookingRequestButtons = ({
  _id,
  status,
  createdBy,
  start,
  end,
  confirmBooking,
  rejectBooking,
}: Props) => {
  const { user } = useAuth();
  const isBookingCancelable =
    createdBy === user?._id &&
    (status === 'open' || status === 'pending' || status === 'confirmed') &&
    dayjs().isBefore(dayjs(end));

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* Hide buttons if start date is in the past: */}
      {new Date(start) > new Date() && (
        <>
          {status === 'checked-in' && (
            <Link passHref href="">
              <Button type="secondary">
                {__('booking_card_join_chat_button')}
              </Button>
            </Link>
          )}
          {status === 'checked-out' && (
            <Link passHref href="">
              <Button type="secondary">
                {__('booking_card_feedback_button')}
              </Button>
            </Link>
          )}
          {status === 'open' && (
            <Link passHref href={`/bookings/${_id}/summary`}>
              <Button type="secondary">
                💰 {__('booking_card_checkout_button')}
              </Button>
            </Link>
          )}
          {status === 'confirmed' && (
            <Link passHref href={`/bookings/${_id}/checkout`}>
              <Button type="secondary">
                💰 {__('booking_card_checkout_button')}
              </Button>
            </Link>
          )}
          {user && isBookingCancelable && (
            <Link passHref href={`/bookings/${_id}/cancel`}>
              <Button type="secondary" className="  uppercase">
                ⭕ {__('booking_cancel_button')}
              </Button>
            </Link>
          )}

          {status === 'paid' && (
            <Link passHref href={`/bookings/${_id}/cancel`}>
              <Button type="secondary">⭕ {__('booking_cancel_button')}</Button>
            </Link>
          )}
        </>
      )}

      {user && user.roles.includes('space-host') && (
        <>
          {status === 'pending' && (
            <Button type="secondary" onClick={confirmBooking}>
              ✅ {__('booking_confirm_button')}
            </Button>
          )}
          {status === 'pending' && (
            <Button type="secondary" onClick={rejectBooking}>
              ❌ {__('booking_reject_button')}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default BookingRequestButtons;
