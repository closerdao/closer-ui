import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Button, Card, ErrorMessage, Input } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { FaPlus } from '@react-icons/all-files/fa/FaPlus';
import { FaTrash } from '@react-icons/all-files/fa/FaTrash';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { BookingConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import PageNotFound from '../not-found';

interface Props {
  bookingConfig: BookingConfig | null;
}

const startDate = new Date();

const FriendsBooking = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { platform }: any = usePlatform();

  const friendsBookingMaxGuests = bookingConfig?.friendsBookingMaxGuests;

  const [emails, setEmails] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check if user has active bookings
  const userBookingsFilter = {
    where: {
      createdBy: user?._id,
      status: ['paid', 'checked-in'],
      end: { $gt: startDate },
    },
    limit: 50,
  };

  const userBookings = platform.booking.find(userBookingsFilter);
  const hasActiveBookings = userBookings && userBookings.size > 0;

  const loadData = async () => {
    if (user?._id) {
      try {
        setLoadError(null);
        await platform.booking.get(userBookingsFilter);
      } catch (err: any) {
        console.error('Error loading user bookings:', err);
        setLoadError(
          err.message || 'Failed to load your bookings. Please try again.',
        );
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user?._id]);

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const isMember = user?.roles.includes('member');

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (!isAuthenticated || !isMember) {
    return (
      <div className="main-content mt-12 px-4 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-500">
            This feature is only available for members.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="main-content mt-12 px-4 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">
              Error Loading Bookings
            </h2>
            <p className="text-red-700 mb-6">{loadError}</p>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setLoadError(null);
                loadData();
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasActiveBookings) {
    return (
      <div className="main-content mt-12 px-4 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {t('friends_booking_no_active_booking_title')}
            </h2>
            <p className="mb-6">
              {t('friends_booking_no_active_booking_message')}
            </p>
            <Button onClick={() => router.push('/bookings/create/dates')}>
              {t('friends_booking_book_stay_button')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const addEmail = () => {
    const maxGuests = friendsBookingMaxGuests || 1;
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

  const handleContinue = async () => {
    setError(null);

    if (!validateEmails()) {
      return;
    }

    setIsLoading(true);

    try {
      const validEmails = emails.filter((email) => email.trim() !== '');
      const emailParam = validEmails.join(',');

      // Redirect to booking flow with isFriendsBooking=true and friend emails
      router.push(
        `/bookings/create/dates?isFriendsBooking=true&friendEmails=${encodeURIComponent(
          emailParam,
        )}`,
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-content mt-12 px-4 max-w-2xl mx-auto">
      <div className="mb-8">
        <Heading level={1} className="text-3xl font-bold mb-4">
          {t('friends_booking_title')}
        </Heading>
        <p className="text-gray-600">{t('friends_booking_subtitle')}</p>
        {friendsBookingMaxGuests && (
          <p className="text-sm text-gray-500 mt-2">
            {t('friends_booking_max_guests_info', {
              maxGuests: friendsBookingMaxGuests,
            })}
          </p>
        )}
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  label={
                    index === 0
                      ? t('friends_booking_email_label')
                      : `${t('friends_booking_email_label')} ${index + 1}`
                  }
                  placeholder={t('friends_booking_email_placeholder')}
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

          <div className="pt-2">
            <Button
              onClick={addEmail}
              isEnabled={emails.length < (friendsBookingMaxGuests || 1)}
              className="text-accent border border-accent bg-transparent hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              {t('friends_booking_add_another')}
            </Button>
            {friendsBookingMaxGuests &&
              emails.length >= friendsBookingMaxGuests && (
                <p className="text-sm text-gray-500 mt-2">
                  {t('friends_booking_max_guests_reached', {
                    maxGuests: friendsBookingMaxGuests,
                  })}
                </p>
              )}
          </div>

          {error && <ErrorMessage error={error} />}

          <div className="pt-4">
            <Button
              onClick={handleContinue}
              isLoading={isLoading}
              isEnabled={emails.some((email) => email.trim() !== '')}
              className="w-full"
            >
              {t('friends_booking_continue')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

FriendsBooking.getInitialProps = async (context: NextPageContext) => {
  try {
    const [bookingRes, messages] = await Promise.all([
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const bookingConfig = bookingRes?.data.results.value;

    return { bookingConfig, messages };
  } catch (err) {
    console.log('Error', err);
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default FriendsBooking;
