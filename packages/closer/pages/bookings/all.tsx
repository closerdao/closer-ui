import Head from 'next/head';

import { useState } from 'react';

import Bookings from '../../components/Bookings';
import BookingsFilter from '../../components/BookingsFilter';
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

const AllBookingsRequestsPage = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const { user } = useAuth();

  const defaultWhere = {
    status: { $ne: 'open' },
  };

  const [filter, setFilter] = useState({
    where: defaultWhere,
  });
  const [page, setPage] = useState(1);

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{t('booking_requests_title_all')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{t('booking_requests_title_all')}</Heading>
        <BookingsFilter
          setFilter={setFilter}
          page={page}
          setPage={setPage}
          defaultWhere={defaultWhere}
        />

        <Bookings filter={filter} setPage={setPage} page={page} />
      </div>
    </>
  );
};

AllBookingsRequestsPage.getInitialProps = async (context: NextPageContext) => {
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

export default AllBookingsRequestsPage;
