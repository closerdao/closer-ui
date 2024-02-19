import { useRouter } from 'next/router';

import { useEffect } from 'react';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { useAuth } from '../../../contexts/auth';
import { BookingConfig } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import '../../../utils/helpers';

interface Props {
  bookingConfig: BookingConfig | null;
}

const NewBooking = ({ bookingConfig }: Props) => {
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
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return null;
};

NewBooking.getInitialProps = async () => {
  try {
    const bookingRes = await api.get('/config/booking').catch(() => {
      return null;
    });
    const bookingConfig = bookingRes?.data.results.value;

    return { bookingConfig };
  } catch (err) {
    console.log('Error', err);
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default NewBooking;
