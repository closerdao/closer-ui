import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { cdn } from '../utils/api';
import { __, getBookingType, priceFormat } from '../utils/helpers';
import { Button } from './ui';

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
  cancelled: 'bg-failure',
  rejected: 'bg-failure',
  open: 'bg-pending',
  pending: 'bg-pending',
  confirmed: 'bg-success',
  paid: 'bg-success',
  'checked-in': 'bg-success',
  'checked-out': 'bg-success',
};

const BookingListPreview = ({
  booking: bookingMapItem,
  listingName,
  userInfo,
  eventName,
}) => {
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
    eventFiat,
  } = bookingMapItem.toJS();
  const router = useRouter();

  const photoUrl = userInfo ? `${cdn}${userInfo?.photo}-profile-sm.jpg` : null;

  const { user } = useAuth();
  const { platform } = usePlatform();
  const startFormatted = dayjs(start).format('DD/MM/YYYY');
  const endFormatted = dayjs(end).format('DD/MM/YYYY');
  const createdFormatted = dayjs(created).format('DD/MM/YYYY - HH:mm:A');
  const isNotPaid = status === 'open';

  const bookingType = getBookingType(eventId, volunteerId);

  const isBookingCancelable =
    createdBy === user?._id &&
    (status === 'open' || status === 'pending' || status === 'confirmed');

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
  };

  return (
    <div className="sm:max-w-[330px] min-w-[220px] max-w-full w-full sm:w-1/3 bg-white rounded-lg p-4 shadow-xl flex-1  flex flex-col ">
      <div className="flex flex-col gap-3">
        <div>
          <p className="card-feature text-center">{createdFormatted}</p>

          <p className="card-feature text-center">
            {__('booking_card_id')}
            {_id}
          </p>
          <p
            className={`mt-2 capitalize opacity-100 text-base p-1 text-white text-center rounded-md ${statusColor[status]}`}
          >
            {status}
          </p>
        </div>
        {router.pathname.includes('requests') && (
          <>
            <Link passHref href={`/members/${createdBy}`}>
              <div className="bg-neutral rounded-md py-1.5 text-center flex items-center gap-2 hover:bg-accent hover:text-white justify-center">
                {userInfo?.photo ? (
                  <Image
                    src={photoUrl}
                    alt={userInfo?.name}
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                ) : (
                  <FaUser className="text-success w-[3opx] h-[30px] " />
                )}
                {userInfo?.name && userInfo?.name}
              </div>
            </Link>
          </>
        )}

        <div className="bg-neutral rounded-md py-1 text-center">
          {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}

          {eventName && ` — ${eventName}`}
        </div>

        <div>
          <p className="card-feature">{__('booking_card_guests')}</p>
          <p>{adults}</p>
        </div>

        {!router.pathname.includes('requests') && (
          <div>
            <p className="card-feature">{__('booking_card_message')}</p>
            <p>{getStatusText(status, updated)}</p>
          </div>
        )}

        <div>
          <p className="card-feature">{__('booking_card_checkin')}</p>
          <p>{startFormatted}</p>
        </div>
        <div>
          <p className="card-feature">{__('booking_card_checkout')}</p>
          <p>{endFormatted}</p>
        </div>
        <div>
          <p className="card-feature">{__('booking_card_nights')}</p>
          <p>{dayjs(end).diff(dayjs(start), 'day')}</p>
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
        {eventFiat !== undefined && (
          <div>
            <p className="card-feature">{__('booking_card_payment_event')}</p>
            <p>
              {priceFormat(eventFiat)}{' '}
              {isNotPaid && (
                <span className="text-failure">
                  {__('booking_card_unpaid')}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {/* Hide buttons if start date is in the past: */}
        {new Date(start) > Date.now() && (
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
            {!router.pathname.includes('requests') && status === 'open' && (
              <Link passHref href={`/bookings/${_id}/summary`}>
                <Button type="secondary">
                  💰 {__('booking_card_checkout_button')}
                </Button>
              </Link>
            )}
            {!router.pathname.includes('requests') &&
              status === 'confirmed' && (
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
                <Button type="secondary">
                  ⭕ {__('booking_cancel_button')}
                </Button>
              </Link>
            )}
          </>
        )}

        {user && user.roles.includes('space-host') && (
          <>
            {status === 'pending' && (
              <Button type="secondary" onClick={(e) => confirmBooking(e)}>
                ✅ {__('booking_confirm_button')}
              </Button>
            )}
            {status === 'pending' && (
              <Button type="secondary" onClick={(e) => rejectBooking(e)}>
                ❌ {__('booking_reject_button')}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingListPreview;
