import Head from 'next/head';

import { useState } from 'react';

import Bookings from '../../components/Bookings';
import AdminLayout from '../../components/Dashboard/AdminLayout';
// import BookingsFilter from '../../components/BookingsFilter';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import PageNotFound from '../not-found';

const loadTime = new Date();

interface Props {
  bookingConfig: any;
}

const BookingsRequests = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const defaultWhere = {
    end: { $gte: loadTime },
    status: 'pending',
  };

  const [filter] = useState({
    where: defaultWhere,
    sort_by: '-created',
  });

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  return (
    <>
      <Head>
        <title>{t('booking_requests_title')}</title>
      </Head>

      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="max-w-screen-xl flex flex-col gap-10">
          <Heading level={1}>{t('booking_requests_title')}</Heading>

          <Bookings filter={filter} setPage={setPage} page={page} />
        </div>
      </AdminLayout>
    </>
  );
};

BookingsRequests.getInitialProps = async (context: NextPageContext) => {
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

export default BookingsRequests;
