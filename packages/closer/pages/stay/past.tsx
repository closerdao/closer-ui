import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';

import Bookings from '../../components/Bookings';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import { useAuth } from '../../contexts/auth';
import { BookingConfig } from '../../types';
import config from '../../configCached';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  bookingConfig: BookingConfig | null;
}

const bookingsToShowLimit = 50;

const StayPastBookingsPage = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const friendOrSelfOr = user
    ? [
        { createdBy: user._id },
        {
          $and: [
            { isFriendsBooking: { $eq: true } },
            { friendEmails: { $exists: true } },
            { friendEmails: { $ne: [] } },
            { friendEmails: { $in: [user.email] } },
          ],
        },
      ]
    : [];

  const filter =
    user &&
    ({
      where: {
        $or: friendOrSelfOr,
        end: { $lt: new Date() },
      },
      limit: bookingsToShowLimit,
    } as const);

  if (!user) {
    return <PageNotFound error="User not logged in." />;
  }

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  return (
    <>
      <Head>
        <title>{t('past_bookings_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="mx-auto flex max-w-screen-lg flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{t('past_bookings_title')}</h1>
          <Link href="/stay/upcoming" className="text-sm text-accent underline">
            {t('bookings_upcoming_tab')}
          </Link>
        </div>
        {filter ? (
          <Bookings
            filter={filter}
            page={page}
            setPage={setPage}
            bookingConfig={bookingConfig ?? undefined}
            hideExportCsv
            bookingDetailHrefPrefix="/stay"
          />
        ) : null}
      </div>
    </>
  );
};

StayPastBookingsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const bookingConfig = config.booking as BookingConfig;
    return { bookingConfig, messages };
  } catch (err: unknown) {
    return {
      bookingConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default StayPastBookingsPage;
