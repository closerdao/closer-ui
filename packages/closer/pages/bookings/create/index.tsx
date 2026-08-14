import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { NextPageContext } from 'next';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { BookingConfig } from '../../../types';
import config from '../../../configCached';
import { parseMessageFromError } from '../../../utils/common';
import '../../../utils/helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

interface Props {
  bookingConfig: BookingConfig | null;
}

const NewBooking = ({ bookingConfig }: Props) => {
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // The two-step /bookings/create flow was replaced by /stay/create, which
  // covers both dates and accommodation. This route stays as a redirect so old
  // links keep working.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/stay/create');
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
    const bookingConfig = config.booking;

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
