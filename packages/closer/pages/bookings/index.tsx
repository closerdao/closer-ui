import Head from 'next/head';

import UserBookings from '../../components/UserBookings';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { BookingConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import PageNotFound from '../not-found';

interface Props {
  bookingConfig: BookingConfig;
}

const BookingsDirectory = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const { user } = useAuth();

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  if (!user) {
    return <PageNotFound error="User not logged in." />;
  }

  return (
    <>
      <Head>
        <title>{t('bookings_title')}</title>
      </Head>

      <UserBookings user={user} bookingConfig={bookingConfig} hideExportCsv={true} />
    </>
  );
};

BookingsDirectory.getInitialProps = async (context: NextPageContext) => {
  try {
    const [bookingRes, messages] = await Promise.all([
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const bookingConfig = bookingRes?.data?.results?.value;
    return {
      bookingConfig,
      messages,
    };
  } catch (err) {
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default BookingsDirectory;
