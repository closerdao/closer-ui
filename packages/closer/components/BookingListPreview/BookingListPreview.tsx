import Link from 'next/link';
import { useRouter } from 'next/router';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { STATUS_COLOR } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import {
  dateToPropertyTimeZone,
  getBookingType,
} from '../../utils/booking.helpers';
import { priceFormat } from '../../utils/helpers';
import BookingRequestButtons from '../BookingRequestButtons';
import UserInfoButton from '../UserInfoButton';
import { Card, LinkButton } from '../ui';

interface Props {
  booking: any;
  listingName: string;
  userInfo: any;
  eventName: string;
  volunteerName: string;
  link: string | null;
  isAdmin?: boolean;
  isPrivate?: boolean;
  isHourly?: boolean;
}

const BookingListPreview = ({
  booking: bookingMapItem,
  listingName,
  userInfo,
  eventName,
  volunteerName,
  link,
  isAdmin,
  isPrivate,
  isHourly,
}: Props) => {
  const t = useTranslations();

  const { APP_NAME, TIME_ZONE } = useConfig();
  const {
    _id,
    start,
    end,
    status,
    created,
    createdBy,
    useTokens,
    useCredits,
    updated,
    adults,
    rentalToken,
    rentalFiat,
    utilityFiat,
    eventId,
    volunteerId,
    eventFiat,
    doesNeedPickup,
    doesNeedSeparateBeds,
    duration,
    adminBookingReason,
    roomOrBedNumbers,
    foodFiat,
  } = bookingMapItem.toJS();

  const router = useRouter();

  const { platform }: any = usePlatform();
  const flagPickup =
    doesNeedPickup && start > new Date(Date.now() - 12 * 60 * 60 * 1000);
  const startFormatted = dayjs(start).format('DD/MM/YYYY');

  const endFormatted = dayjs(end).format('DD/MM/YYYY');
  const createdFormatted = dayjs(created).format('DD/MM/YYYY - HH:mm:A');
  const isNotPaid =
    status !== 'paid' &&
    status !== 'tokens-staked' &&
    status !== 'credits-paid';

  const bookingType = getBookingType(eventId, volunteerId);

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
  };

  const getStatusText = (status: string, updated: string | Date) => {
    if (status === 'cancelled') {
      return t('booking_status_cancelled', {
        var: dayjs(updated).format('DD/MM/YYYY'),
      });
    }

    interface StatusText {
      [key: string]: string;
    }

    const statusText: StatusText = {
      rejected: t('booking_status_rejected'),
      open: t('booking_status_open'),
      pending: t('booking_status_pending'),

      confirmed: t('booking_status_confirmed'),
      paid: t('booking_status_paid'),

      'checked-in': t('booking_status_checked_in'),
      'checked-out': t('booking_status_checked_out'),
    };

    return statusText[status];
  };

  return (
    <div className="gap-2 sm:max-w-[330px] min-w-[220px] max-w-full w-full sm:w-1/3 bg-white rounded-lg p-4 shadow-xl flex-1  flex flex-col ">
      <div>
        {flagPickup && (
          <div className=" bg-failure rounded-md p-1 text-white text-center justify-center">
            Pickup Needed
          </div>
        )}

        <p className="card-feature text-center">{createdFormatted}</p>

        <Link
          className="text-disabled text-xs bg-neutral rounded-md py-1.5 text-center flex items-center gap-2 hover:bg-accent hover:text-white justify-center"
          href={`/bookings/${_id}`}
        >
          #{_id}
        </Link>

        {adminBookingReason && (
          <Card className="bg-accent text-white py-1 text-center text-xs mt-1.5">
            {adminBookingReason}
          </Card>
        )}
        <p
          className={` mt-2 capitalize opacity-100 text-base p-1 text-white text-center rounded-md  bg-${STATUS_COLOR[status]}`}
        >
          {status === 'confirmed'
            ? t('booking_status_confirmed_title')
            : status}
        </p>
      </div>

      <UserInfoButton size="md" userInfo={userInfo} createdBy={createdBy} />

      {link ? (
        <Link
          className="bg-neutral rounded-md p-1.5 text-center flex items-center gap-2 hover:bg-accent hover:text-white justify-center"
          href={link}
        >
          {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
          {eventName && ` — ${eventName}`}
          {volunteerName && ` — ${volunteerName}`}
        </Link>
      ) : (
        <p className="bg-neutral rounded-md p-1.5 text-center flex items-center gap-2  justify-center">
          {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
          {eventName && ` — ${eventName}`}
          {volunteerName && ` — ${volunteerName}`}
        </p>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <p className="card-feature">{t('booking_card_guests')}</p>
          <p>{adults}</p>
        </div>
        <div className="flex-1">
          <p className="card-feature">{t('booking_card_nights')}</p>
          <p>{isHourly ? '-' : duration}</p>
        </div>
      </div>

      {!router.pathname.includes('requests') && !isAdmin && (
        <div>
          <p className="card-feature">{t('booking_card_message')}</p>
          <p>{getStatusText(status, updated)}</p>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <p className="card-feature">{t('booking_card_checkin')}</p>
          <p>
            {isHourly
              ? dateToPropertyTimeZone(TIME_ZONE, start)
              : startFormatted}
          </p>
        </div>
        <div className="flex-1">
          <p className="card-feature">{t('booking_card_checkout')}</p>
          <p>
            {isHourly ? dateToPropertyTimeZone(TIME_ZONE, end) : endFormatted}
          </p>
        </div>
      </div>

      <div>
        <p className="card-feature">{t('booking_card_type')}</p>
        <p>
          {listingName} {!isPrivate && t('booking_card_beds')}{' '}
          {roomOrBedNumbers.toString()}
        </p>
      </div>

      <div>
        <p className="card-feature">{t('booking_card_diet')}</p>
        <p>{userInfo?.diet || '-'}</p>
      </div>

      <div>
        <p className="card-feature">{t('booking_card_payment_accomodation')}</p>
        <p>
          {useTokens && priceFormat(rentalToken)}
          {useCredits &&
            priceFormat({
              val: rentalToken.val,
              cur: 'credits',
              creditSymbol: t('carrots_balance') + t('carrots_heading'),
            })}
          {!useCredits && !useTokens && priceFormat(rentalFiat)}

          {isNotPaid && (
            <span className="text-failure">{t('booking_card_unpaid')}</span>
          )}
        </p>
      </div>

      {utilityFiat && (
        <div>
          <p className="card-feature">{t('booking_card_payment_utility')}</p>
          <p>
            {priceFormat(utilityFiat)}{' '}
            {isNotPaid && (
              <span className="text-failure">{t('booking_card_unpaid')}</span>
            )}
          </p>
        </div>
      )}

      <div>
        <p className="card-feature">{t('booking_food')}</p>
        <p>
          {priceFormat(foodFiat)}{' '}
          {isNotPaid && (
            <span className="text-failure">{t('booking_card_unpaid')}</span>
          )}
        </p>
      </div>
      {eventFiat !== undefined && (
        <div>
          <p className="card-feature">{t('booking_card_payment_event')}</p>
          <p>
            {priceFormat(eventFiat)}{' '}
            {isNotPaid && (
              <span className="text-failure">{t('booking_card_unpaid')}</span>
            )}
          </p>
        </div>
      )}

      {doesNeedPickup && doesNeedPickup === true && (
        <div>
          <p className="card-feature">{t('booking_card_pickup_needed')}</p>
          <p>✅</p>
        </div>
      )}
      {doesNeedSeparateBeds && doesNeedSeparateBeds === true && (
        <div>
          <p className="card-feature">
            {t('booking_card_separate_beds_needed')}
          </p>
          <p>✅</p>
        </div>
      )}

      {userInfo?.email && (
        <LinkButton
          className="mt-6"
          variant="secondary"
          href={`mailto:${userInfo.email}`}
        >
          {t('booking_card_email_user')}
        </LinkButton>
      )}

      <BookingRequestButtons
        _id={_id}
        status={status}
        createdBy={createdBy}
        end={end}
        start={start}
        confirmBooking={confirmBooking}
        rejectBooking={rejectBooking}
      />
    </div>
  );
};

export default BookingListPreview;
