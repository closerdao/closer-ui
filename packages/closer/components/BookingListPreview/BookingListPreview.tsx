import Link from 'next/link';
import { useRouter } from 'next/router';

import { useState } from 'react';

import { BookingConfig } from '../../types/api';

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { MessageSquareMore } from 'lucide-react';
import { useTranslations } from 'next-intl';

import BookingRequestButtons from '../BookingRequestButtons';
import BookingStatusTag from '../BookingStatusTag';
import BookingSurface from '../booking/bookingSurface';
import UserInfoButton from '../UserInfoButton';
import { Button, LinkButton, Spinner } from '../ui';
import Heading from '../ui/Heading';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { dateToPropertyTimeZone } from '../../utils/booking.helpers';

dayjs.extend(isSameOrBefore);

const sectionLabelClass =
  'text-[11px] font-semibold uppercase tracking-wide text-disabled';

const previewSecondaryCn =
  '!normal-case tracking-normal rounded-lg enabled:!border-line enabled:!bg-neutral-light !text-foreground !min-h-8 hover:!scale-100 !border-2 !py-2 !text-xs';

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
  eventChatLink?: string;
  bookingConfig?: BookingConfig;
}

const BookingListPreview = ({
  booking: bookingMapItem,
  listingName,
  userInfo,
  eventName,
  volunteerName,
  link,
  isAdmin: _isAdmin,
  isPrivate,
  isHourly,
  eventChatLink,
  bookingConfig,
}: Props) => {
  const t = useTranslations();

  const { TIME_ZONE } = useConfig();

  const chatLink = eventChatLink || bookingConfig?.chatLink || '';

  const raw = bookingMapItem.toJS();
  const {
    _id,
    start,
    end,
    status,
    created,
    createdBy,
    adults,
    doesNeedPickup,
    adminBookingReason,
    roomOrBedNumbers,
    paidBy,
    isFriendsBooking,
  } = raw;

  const router = useRouter();

  const { platform }: any = usePlatform();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const isPaidBooking =
    status === 'paid' ||
    status === 'credits-paid' ||
    status === 'tokens-staked';

  const isSpaceHost = user?.roles.includes('space-host');
  const isOwnBooking =
    createdBy === user?._id || bookingMapItem.get('paidBy') === user?._id;

  const flagPickup =
    doesNeedPickup && start > new Date(Date.now() - 12 * 60 * 60 * 1000);
  const startFormatted = dayjs(start).format('DD/MM/YYYY');

  const endFormatted = dayjs(end).format('DD/MM/YYYY');
  const createdFormatted = dayjs(created).format('DD/MM/YYYY - HH:mm:A');

  const confirmBooking = async () => {
    await platform.bookings.confirm(_id);
  };
  const rejectBooking = async () => {
    await platform.bookings.reject(_id);
  };

  const checkInBooking = async () => {
    try {
      setIsLoading(true);
      await platform.bookings.checkIn(_id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const checkOutBooking = async () => {
    try {
      setIsLoading(true);
      await platform.bookings.checkOut(_id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusTagLabel =
    status === 'confirmed' ? t('booking_status_confirmed_title') : undefined;

  const roomBedDisplay = (
    Array.isArray(roomOrBedNumbers)
      ? roomOrBedNumbers
      : roomOrBedNumbers != null
        ? [roomOrBedNumbers]
        : []
  ).join(', ');

  const detailParts = [eventName, volunteerName].filter(Boolean);
  const detailLine = detailParts.join(' · ');
  const eventVolunteerHref = link && detailParts.length > 0 ? link : undefined;

  return (
    <BookingSurface
      tone="elevated"
      padding="md"
      className="flex w-full flex-col gap-3 focus-within:outline-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Heading level={4} className="!mt-0 max-w-[min(100%,20rem)] flex-1 font-semibold tracking-normal normal-case">
          <Link
            href={`/bookings/${_id}`}
            className="text-foreground outline-none hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded-sm"
          >
            {listingName}
          </Link>
        </Heading>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {flagPickup && (
            <span className="inline-flex items-center rounded-full bg-failure px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              {t('booking_card_pickup_needed')}
            </span>
          )}
          <BookingStatusTag status={status} label={statusTagLabel} />
          {isFriendsBooking && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              {t('friends_booking_title')}
            </span>
          )}
        </div>
      </div>

      {!router.pathname.includes('requests') &&
        detailLine &&
        (eventVolunteerHref ? (
          <Link
            href={eventVolunteerHref}
            className="text-sm text-muted-foreground outline-none hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded-sm"
          >
            {detailLine}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">{detailLine}</p>
        ))}

      {roomBedDisplay ? (
        <p className="text-xs text-disabled">
          {listingName}{' '}
          {!isPrivate && t('booking_card_beds')} {roomBedDisplay}
        </p>
      ) : null}

      <div className="flex flex-col gap-0.5 text-xs text-disabled">
        <p>{createdFormatted}</p>
        <p className="break-all">
          <Link
            className="font-medium text-foreground outline-none hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded-sm"
            href={`/bookings/${_id}`}
          >
            # {_id}
          </Link>
        </p>
      </div>

      {adminBookingReason && (
        <BookingSurface tone="banner" padding="sm" className="text-center text-xs font-semibold">
          {adminBookingReason}
        </BookingSurface>
      )}

      <UserInfoButton variant="preview" userInfo={userInfo} createdBy={paidBy || createdBy} />

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <div>
          <p className={sectionLabelClass}>{t('booking_card_checkin')}</p>
          <p>
            {isHourly ? dateToPropertyTimeZone(TIME_ZONE, start) : startFormatted}
          </p>
        </div>
        <div>
          <p className={sectionLabelClass}>{t('booking_card_checkout')}</p>
          <p>
            {isHourly ? dateToPropertyTimeZone(TIME_ZONE, end) : endFormatted}
          </p>
        </div>
      </div>
      <div className="flex gap-4 text-sm">
        <p>
          <span className={sectionLabelClass}>{t('booking_card_guests')} </span>
          <span>{adults}</span>
        </p>
      </div>

      {chatLink ? (
        <LinkButton
          size="small"
          className={previewSecondaryCn}
          href={chatLink}
          variant="secondary"
          isFullWidth={false}
        >
          <span className="flex items-center gap-2">
            <MessageSquareMore className="h-4 w-4 shrink-0" />
            <span className="normal-case tracking-normal">
              {eventName
                ? t('booking_card_open_event_chat')
                : t('booking_card_open_chat')}
            </span>
          </span>
        </LinkButton>
      ) : null}

      <div className="flex flex-col gap-2 pt-1">
        {userInfo?.email && !isOwnBooking && (
          <LinkButton variant="secondary" size="small" className={previewSecondaryCn} href={`mailto:${userInfo.email}`}>
            {t('booking_card_email_user')}
          </LinkButton>
        )}

        {isOwnBooking && status === 'confirmed' && (
          <Link href={`/bookings/${_id}/checkout`} passHref>
            <Button
              variant="primary"
              size="small"
              className="!normal-case tracking-normal rounded-lg hover:!scale-100 !text-xs !min-h-8"
            >
              {t('checkout_complete_payment')}
            </Button>
          </Link>
        )}

        {isPaidBooking &&
          isSpaceHost &&
          dayjs(bookingMapItem.get('end')).isAfter(dayjs()) &&
          dayjs(bookingMapItem.get('start')).isSameOrBefore(dayjs(), 'day') &&
          status !== 'checked-in' && (
            <Button
              variant="secondary"
              size="small"
              className={previewSecondaryCn}
              onClick={checkInBooking}
              isEnabled={!isLoading}
            >
              {t('booking_card_checkin')} {isLoading && <Spinner />}
            </Button>
          )}
        {status === 'checked-in' && (isSpaceHost || isOwnBooking) && (
          <Button
            variant="secondary"
            size="small"
            className={previewSecondaryCn}
            onClick={checkOutBooking}
            isEnabled={!isLoading}
          >
            {t('booking_card_checkout')} {isLoading && <Spinner />}
          </Button>
        )}

        <BookingRequestButtons
          listPreview
          _id={_id}
          status={status}
          createdBy={createdBy}
          paidBy={bookingMapItem.get('paidBy')}
          end={end}
          start={start}
          confirmBooking={confirmBooking}
          rejectBooking={rejectBooking}
        />
      </div>
    </BookingSurface>
  );
};

export default BookingListPreview;
