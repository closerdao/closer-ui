import Link from 'next/link';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { IconBanknote, IconCheckCircle, IconCircle, IconXCircle } from '../BookingIcons';
import { Button } from '../ui';

dayjs.extend(utc);

interface Props {
  _id: string;
  status: string;
  createdBy: string;
  paidBy?: string;
  confirmBooking: () => void;
  start: string | Date;
  end: string | Date;
  rejectBooking: () => void;
  isFiatBooking?: boolean;
}

const BookingRequestButtons = ({
  _id,
  status,
  createdBy,
  paidBy,
  end,
  confirmBooking,
  rejectBooking,
  isFiatBooking = true,
}: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');

  const isOwnBooking = user?._id === createdBy || user?._id === paidBy;

  const isBookingCancelable =
    (isOwnBooking || isSpaceHost) &&
    (status === 'open' ||
      status === 'pending' ||
      status === 'confirmed' ||
      status === 'paid') &&
    dayjs().isBefore(dayjs(end)) &&
    isFiatBooking;

  return (
    <div className="mt-4 flex flex-col gap-4">

      {/* Hide buttons if start date is in the past: */}


          {/* TODO: add links for checked in and checked out guests */}
          {/* {status === 'checked-in' && (
            <Link passHref href="">
              <Button variant="secondary">
                {t('booking_card_join_chat_button')}
              </Button>
            </Link>
          )}
          {status === 'checked-out' && (
            <Link passHref href="">
              <Button variant="secondary">
                {t('booking_card_feedback_button')}
              </Button>
            </Link>
          )} */}
          {status === 'open' && (
            <Link passHref href={`/bookings/${_id}/summary`}>
              <Button variant="secondary">
                <><IconBanknote className="mr-0 shrink-0" /> {t('booking_card_checkout_button')}</>
              </Button>
            </Link>
          )}
          {status === 'confirmed' && user && isOwnBooking && (
            <Link passHref href={`/bookings/${_id}/checkout`}>
              <Button variant="secondary">
                <><IconBanknote className="mr-0 shrink-0" /> {t('booking_card_checkout_button')}</>
              </Button>
            </Link>
          )}

          

          {status === 'tokens-staked' && user && isOwnBooking && (
            <Link passHref href={`/bookings/${_id}/checkout`}>
              <Button variant="secondary">
                <><IconBanknote className="mr-0 shrink-0" /> {t('booking_card_checkout_button')}</>
              </Button>
            </Link>
          )}
          {status === 'credits-paid' && user && isOwnBooking && (
            <Link passHref href={`/bookings/${_id}/checkout`}>
              <Button variant="secondary">
                <><IconBanknote className="mr-0 shrink-0" /> {t('booking_card_checkout_button')}</>
              </Button>
            </Link>
          )}
          {status === 'pending-payment' && user && isOwnBooking && (
            <Link passHref href={`/bookings/${_id}/checkout`}>
              <Button variant="secondary">
                <><IconBanknote className="mr-0 shrink-0" /> {t('booking_card_checkout_button')}</>
              </Button>
            </Link>
          )}
          {user && isBookingCancelable && isOwnBooking && !isSpaceHost && (
            <Link passHref href={`/bookings/${_id}/cancel`}>
              <Button variant="secondary" className="  uppercase">
                <><IconCircle className="mr-0 shrink-0" /> {t('booking_cancel_button')}</>
              </Button>
            </Link>
          )}




      {isSpaceHost && Boolean(user && isBookingCancelable && isOwnBooking) && (
        <Link passHref href={`/bookings/${_id}/cancel`}>
          <Button variant="secondary"><><IconCircle className="mr-0 shrink-0" /> {t('booking_cancel_button')}</></Button>
        </Link>
      )}
      {user && user.roles.includes('space-host') && (
        <>
          {status === 'pending' && (
            <Button variant="secondary" onClick={confirmBooking}>
              <><IconCheckCircle className="mr-0 shrink-0" /> {t('booking_confirm_button')}</>
            </Button>
          )}
          {status === 'pending' && (
            <Button variant="secondary" onClick={rejectBooking}>
              <><IconXCircle className="mr-0 shrink-0" /> {t('booking_reject_button')}</>
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default BookingRequestButtons;
