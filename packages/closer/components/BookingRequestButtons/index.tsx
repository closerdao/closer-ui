import Link from 'next/link';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '../../contexts/auth';
import { Booking } from '../../types';
import { getBookingPaymentCheckoutPath } from '../../utils/booking.helpers';
import { IconBanknote, IconCheckCircle, IconXCircle } from '../BookingIcons';
import { Button } from '../ui';

dayjs.extend(utc);

const listPreviewButtonCn =
  '!normal-case !tracking-normal rounded-lg enabled:!border-line enabled:!bg-neutral-light !text-foreground hover:!scale-100 !border-2 !py-2 !text-xs !min-h-8';

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
  openCheckout?: () => void | Promise<void>;
  checkoutLoading?: boolean;
  listPreview?: boolean;
  hideCheckoutButton?: boolean;
  hideCancelButton?: boolean;
  stayShaped?: boolean;
  paymentDelta?: Booking['paymentDelta'] | null;
  useTokens?: boolean;
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
  openCheckout,
  checkoutLoading = false,
  listPreview = false,
  hideCheckoutButton = false,
  hideCancelButton = false,
  stayShaped = false,
  paymentDelta,
  useTokens = false,
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

  const secondaryCn = listPreview ? listPreviewButtonCn : undefined;
  const size = listPreview ? 'small' : 'medium';

  const CheckoutLabel = listPreview ? (
    t('booking_card_checkout_button')
  ) : (
    <>
      <IconBanknote className="mr-0 shrink-0" /> {t('booking_card_checkout_button')}
    </>
  );

  const stackClass = twMerge(listPreview ? 'mt-2 flex flex-col gap-2' : 'mt-4 flex flex-col gap-4');

  const checkoutHref = getBookingPaymentCheckoutPath({
    bookingId: _id,
    stayShaped,
    status,
    paymentDelta,
    useTokens,
  });
  const openStepHref = checkoutHref;
  const paymentCheckoutHref = checkoutHref;

  return (
    <div className={stackClass}>
      {!hideCheckoutButton &&
        status === 'open' &&
        (openCheckout ? (
          <Button
            variant="secondary"
            size={size}
            className={secondaryCn}
            isLoading={checkoutLoading}
            onClick={() => void openCheckout()}
          >
            {CheckoutLabel}
          </Button>
        ) : (
          <Link passHref href={openStepHref}>
            <Button variant="secondary" size={size} className={secondaryCn}>
              {CheckoutLabel}
            </Button>
          </Link>
        ))}
      {!hideCheckoutButton &&
        status === 'confirmed' &&
        user &&
        isOwnBooking &&
        (openCheckout ? (
          <Button
            variant="secondary"
            size={size}
            className={secondaryCn}
            isLoading={checkoutLoading}
            onClick={() => void openCheckout()}
          >
            {CheckoutLabel}
          </Button>
        ) : (
          <Link passHref href={paymentCheckoutHref}>
            <Button variant="secondary" size={size} className={secondaryCn}>
              {CheckoutLabel}
            </Button>
          </Link>
        ))}

      {!hideCheckoutButton &&
        status === 'tokens-staked' &&
        user &&
        isOwnBooking &&
        (openCheckout ? (
          <Button
            variant="secondary"
            size={size}
            className={secondaryCn}
            isLoading={checkoutLoading}
            onClick={() => void openCheckout()}
          >
            {CheckoutLabel}
          </Button>
        ) : (
          <Link passHref href={paymentCheckoutHref}>
            <Button variant="secondary" size={size} className={secondaryCn}>
              {CheckoutLabel}
            </Button>
          </Link>
        ))}
      {!hideCheckoutButton &&
        status === 'credits-paid' &&
        user &&
        isOwnBooking &&
        (openCheckout ? (
          <Button
            variant="secondary"
            size={size}
            className={secondaryCn}
            isLoading={checkoutLoading}
            onClick={() => void openCheckout()}
          >
            {CheckoutLabel}
          </Button>
        ) : (
          <Link passHref href={paymentCheckoutHref}>
            <Button variant="secondary" size={size} className={secondaryCn}>
              {CheckoutLabel}
            </Button>
          </Link>
        ))}
      {!hideCheckoutButton &&
        status === 'pending-payment' &&
        user &&
        isOwnBooking &&
        (openCheckout ? (
          <Button
            variant="secondary"
            size={size}
            className={secondaryCn}
            isLoading={checkoutLoading}
            onClick={() => void openCheckout()}
          >
            {CheckoutLabel}
          </Button>
        ) : (
          <Link passHref href={paymentCheckoutHref}>
            <Button variant="secondary" size={size} className={secondaryCn}>
              {CheckoutLabel}
            </Button>
          </Link>
        ))}

      {!hideCancelButton &&
        user &&
        isBookingCancelable &&
        isOwnBooking &&
        !isSpaceHost && (
        <Link passHref href={`/bookings/${_id}/cancel`}>
          <Button variant="secondary" size={size} className={secondaryCn}>
            {t('booking_cancel_button')}
          </Button>
        </Link>
      )}

      {!hideCancelButton &&
        isSpaceHost &&
        Boolean(user && isBookingCancelable && isOwnBooking) && (
        <Link passHref href={`/bookings/${_id}/cancel`}>
          <Button variant="secondary" size={size} className={secondaryCn}>
            {t('booking_cancel_button')}
          </Button>
        </Link>
      )}
      {user && user.roles.includes('space-host') && (
        <>
          {status === 'pending' && (
            <Button variant="secondary" size={size} className={secondaryCn} onClick={confirmBooking}>
              {listPreview ? (
                t('booking_confirm_button')
              ) : (
                <>
                  <IconCheckCircle className="mr-0 shrink-0" />{' '}
                  {t('booking_confirm_button')}
                </>
              )}
            </Button>
          )}
          {status === 'pending' && (
            <Button variant="secondary" size={size} className={secondaryCn} onClick={rejectBooking}>
              {listPreview ? (
                t('booking_reject_button')
              ) : (
                <>
                  <IconXCircle className="mr-0 shrink-0" /> {t('booking_reject_button')}
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default BookingRequestButtons;
