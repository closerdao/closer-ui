import Link from 'next/link';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { Button } from '../ui';

dayjs.extend(utc);

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
  const t = useTranslations();
  const { user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');
  const isBookingCancelable =
    (createdBy === user?._id || isSpaceHost) &&
    (status === 'open' || status === 'pending' || status === 'confirmed') &&
    dayjs().isBefore(dayjs(end));

  return (
    <div className="mt-4 flex flex-col gap-4">
  
      {/* Hide buttons if start date is in the past: */}
      {new Date(start) > new Date() && (
        <>
          {status === 'checked-in' && (
            <Link passHref href="">
              <Button type="secondary">
                {t('booking_card_join_chat_button')}
              </Button>
            </Link>
          )}
          {status === 'checked-out' && (
            <Link passHref href="">
              <Button type="secondary">
                {t('booking_card_feedback_button')}
              </Button>
            </Link>
          )}
          {status === 'open' && (
            <Link passHref href={`/bookings/${_id}/summary`}>
              <Button type="secondary">
                💰 {t('booking_card_checkout_button')}
              </Button>
            </Link>
          )}
          {status === 'confirmed' && user && user._id === createdBy && (
            <Link passHref href={`/bookings/${_id}/checkout`}>
              <Button type="secondary">
                💰 {t('booking_card_checkout_button')}
              </Button>
            </Link>
          )}
          {user && isBookingCancelable && user._id === createdBy && (
            <Link passHref href={`/bookings/${_id}/cancel`}>
              <Button type="secondary" className="  uppercase">
                ⭕ {t('booking_cancel_button')}
              </Button>
            </Link>
          )}

        </>
      )}
      {isSpaceHost && !Boolean(user && isBookingCancelable && user._id === createdBy) && (
        <Link passHref href={`/bookings/${_id}/cancel`}>
          <Button type="secondary">⭕ {t('booking_cancel_button')}</Button>
        </Link>
      )}
      {user && user.roles.includes('space-host') && (
        <>
          {status === 'pending' && (
            <Button type="secondary" onClick={confirmBooking}>
              ✅ {t('booking_confirm_button')}
            </Button>
          )}
          {status === 'pending' && (
            <Button type="secondary" onClick={rejectBooking}>
              ❌ {t('booking_reject_button')}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default BookingRequestButtons;
