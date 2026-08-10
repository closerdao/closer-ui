import Head from 'next/head';

import { useMemo, useState } from 'react';

import Bookings from '../../components/Bookings';
import BookingsSearchBar from '../../components/BookingsSearchBar';
import AdminLayout from '../../components/Dashboard/AdminLayout';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import config from '../../configCached';
import { useBookingSearchWhere } from '../../hooks/useBookingSearchWhere';
import { mergeBookingSearchWhere } from '../../utils/bookingSearch.helpers';
import { parseMessageFromError } from '../../utils/common';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import PageNotFound from '../not-found';

const loadTime = new Date();

const defaultWhere = {
  end: { $gte: loadTime },
  $or: [
    { status: 'pending' },
    {
      'pendingExtension.requestedAt': { $exists: true, $ne: null },
    },
  ],
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const { searchWhere, isSearching } = useBookingSearchWhere(searchTerm);

  const filter = useMemo(
    () => ({
      where: mergeBookingSearchWhere(defaultWhere, searchWhere),
      sort_by: '-created',
    }),
    [searchWhere],
  );

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

      <AdminLayout>
        <div className="max-w-screen-xl flex flex-col gap-10">
          <Heading level={1}>{t('booking_requests_title')}</Heading>

          <BookingsSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            isSearching={isSearching}
            className="max-w-md"
          />

          <Bookings
            filter={filter}
            setPage={setPage}
            page={page}
            bookingConfig={bookingConfig}
          />
        </div>
      </AdminLayout>
    </>
  );
};

BookingsRequests.getInitialProps = async (context: NextPageContext) => {
  try {

    const bookingConfig = config.booking;
    return {
      bookingConfig,
    };
  } catch (err: unknown) {
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default BookingsRequests;
