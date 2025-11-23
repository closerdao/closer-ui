import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

import BookingBackButton from '../../../components/BookingBackButton';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import { Button, Card, ErrorMessage, Input } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  Event,
} from '../../../types';
import api, { formatSearch } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props extends BaseBookingParams {
  booking: Booking | null;

  event?: Event;
  bookingConfig: BookingConfig | null;
}

const GuestsSelectionPage = ({
  booking,

  event,
  bookingConfig,
}: Props) => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const {
    useTokens,
    start,
    end,
    adults,
    children,
    pets,
    infants,
    eventId,
    isFriendsBooking,
  } = booking || {};

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  const maxGuests =
    booking?.adults && booking?.adults > 1 ? booking?.adults - 1 : 1;

  const addEmail = () => {
    if (emails.length < maxGuests) {
      setEmails([...emails, '']);
    }
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const validateEmails = () => {
    const validEmails = emails.filter((email) => email.trim() !== '');
    if (validEmails.length === 0) {
      setError(t('friends_booking_emails_required'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of validEmails) {
      if (!emailRegex.test(email)) {
        setError('Please enter valid email addresses');
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    if (booking?.status === 'pending' || booking?.status === 'paid') {
      router.push(`/bookings/${booking?._id}`);
    }
  }, [booking?.status]);

  const handleNext = async () => {
    if (!validateEmails()) {
      return;
    }

    try {
      setApiError(null);
      setIsLoading(true);

      const validEmails = emails.filter((email) => email.trim() !== '');

      let guestUserIds: string[] = [];
      if (validEmails.length > 0) {
        const usersResponse = await api.get(
          `/user?where=${formatSearch({ email: { $in: validEmails } })}`,
        );
        guestUserIds =
          usersResponse.data?.results?.map(
            (user: { _id: string }) => user._id,
          ) || [];
      }

      console.log('guestUserIds=', guestUserIds);

      await api.patch(`/booking/${booking?._id}`, {
        managedBy: [...(booking?.managedBy || []), ...guestUserIds],
      });

      if (event?.fields) {
        router.push(`/bookings/${booking?._id}/questions`);
        return;
      }
    } catch (err: any) {
      setApiError(err);
    } finally {
      setIsLoading(false);
    }

    router.push(`/bookings/${booking?._id}/rules`);
  };

  const getUrlParams = () => {
    const dateFormat = 'YYYY-MM-DD HH:mm';
    const params = {
      start: dayjs(start as string).format(dateFormat),
      end: dayjs(end as string).format(dateFormat),
      adults: String(adults),
      ...(children && { kids: String(children) }),
      ...(infants && { infants: String(infants) }),
      ...(pets && { pets: String(pets) }),
      useTokens: String(booking?.useTokens),
    };
    const urlParams = new URLSearchParams(params);

    return urlParams;
  };

  const goBack = () => {
    const dateFormat = 'YYYY-MM-DD';
    router.push(
      `/bookings/create/accomodation?start=${dayjs(start).format(
        dateFormat,
      )}&end=${dayjs(end).format(
        dateFormat,
      )}&adults=${adults}&useTokens=${useTokens}${
        isFriendsBooking ? '&isFriendsBooking=true' : ''
      }`,
    );
  };

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <div className="w-full max-w-screen-sm mx-auto p-8">
      <BookingBackButton onClick={goBack} name={t('buttons_back')} />
      <FriendsBookingBlock isFriendsBooking={isFriendsBooking} />
      <Heading level={1} className="pb-4 mt-8">
        <span className="mr-4">👨‍👩‍👦</span>
        <span>Enter guests' emails (optional)</span>
      </Heading>
      {apiError && <div className="error-box">{apiError}</div>}
      <ProgressBar steps={BOOKING_STEPS} />

      <section className="flex flex-col gap-12 py-12">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              Enter the email addresses of the guests staying with you. Make
              sure each one matches the email they use for their{' '}
              {APP_NAME.toUpperCase()} account.
            </div>
            {emails.map((email, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    label={
                      index === 0
                        ? "Guest's email"
                        : `Guest ${index + 1}'s email`
                    }
                    placeholder={`Enter guest ${index + 1}'s email`}
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    validation="email"
                  />
                </div>
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmail(index)}
                    className="mt-6 p-2 text-red-500 hover:text-red-700"
                    title={t('friends_booking_remove')}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {maxGuests > emails.length && (
              <div className="pt-2">
                <Button
                  onClick={addEmail}
                  isEnabled={emails.length < (maxGuests || 1)}
                  className="text-accent border border-accent bg-transparent hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  {t('friends_booking_add_another')}
                </Button>
                {maxGuests && emails.length >= maxGuests && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t('friends_booking_max_guests_reached', {
                      maxGuests,
                    })}
                  </p>
                )}
              </div>
            )}

            {error && <ErrorMessage error={error} />}

            <div className="pt-4">
              <Button
                onClick={handleNext}
                isLoading={isLoading}
                isEnabled={true}
                className="w-full"
              >
                {t('booking_button_continue')}
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

GuestsSelectionPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;

  try {
    const [bookingRes, bookingConfigRes, messages] = await Promise.all([
      api
        .get(`/booking/${query.slug}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/booking').catch(() => {
        return null;
      }),

      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const booking = bookingRes?.data?.results || null;
    const bookingConfig = bookingConfigRes?.data?.results?.value || null;

    const [optionalEvent, optionalListing] = await Promise.all([
      booking?.eventId &&
        api.get(`/event/${booking?.eventId}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        }),
      booking?.listing &&
        api.get(`/listing/${booking?.listing}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        }),
    ]);
    const event = optionalEvent?.data?.results;
    const listing = optionalListing?.data?.results;

    return {
      booking,

      event,
      error: null,
      bookingConfig,
      messages,
    };
  } catch (err) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      booking: null,

      bookingConfig: null,
      messages: null,
    };
  }
};

export default GuestsSelectionPage;
