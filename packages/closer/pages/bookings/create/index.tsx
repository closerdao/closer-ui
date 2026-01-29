import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { BookingConfig } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageNotFound from '../../not-found';

interface Props {
  bookingConfig: BookingConfig | null;
}

const NewBooking = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/bookings/create/dates');
    }
  }, [isAuthenticated]);

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return null;
};

NewBooking.getInitialProps = async (context: NextPageContext) => {
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

export default NewBooking;
