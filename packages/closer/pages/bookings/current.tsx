import Head from 'next/head';

import CurrentBooking from '../../components/CurrentBooking';
import AdminLayout from '../../components/Dashboard/AdminLayout';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  bookingConfig: any;
}

const CurrentBookings = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const { user } = useAuth();

  const loadTime = Date.now();
  const dayAsMs = 24 * 60 * 60 * 1000;
  const threeDaysAgo = new Date(loadTime - 3 * dayAsMs);
  const inSevenDays = new Date(loadTime + 7 * dayAsMs);

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{t('current_bookings_title')}</title>
      </Head>

      <AdminLayout>
        <div className="max-w-screen-xl flex flex-col gap-10">
          <Heading level={1}>{t('current_bookings_title')}</Heading>

          <CurrentBooking leftAfter={threeDaysAgo} arriveBefore={inSevenDays} />
        </div>
      </AdminLayout>
    </>
  );
};

CurrentBookings.getInitialProps = async (context: NextPageContext) => {
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
  } catch (err: unknown) {
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default CurrentBookings;
