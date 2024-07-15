import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CancelBooking from '../../../components/CancelBooking';
import CancelCompleted from '../../../components/CancelCompleted';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { BaseBookingParams, Booking, BookingConfig } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { calculateRefundTotal } from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props extends BaseBookingParams {
  booking: Booking | null;
  bookingConfig: BookingConfig | null;
  error?: string;
}

const BookingCancelPage = ({ booking, bookingConfig, error }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const router = useRouter();
  const bookingId = router.query.slug;
  const bookingPrice = booking?.total || {
    val: booking && booking?.utilityFiat?.val + booking?.rentalFiat?.val,
    cur: booking?.rentalFiat?.cur,
  };
  const { isAuthenticated, user } = useAuth();
  const isMember = user?.roles.includes('member');
  const [policy, setPolicy] = useState<any>(null);
  const [isPolicyLoading, setPolicyLoading] = useState(false);
  const [isCancelCompleted, setCancelCompleted] = useState(false);
  const refundTotal = calculateRefundTotal({
    bookingStatus: booking?.status,
    initialValue: bookingPrice.val,
    policy,
    startDate: booking?.start,
  });

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setPolicyLoading(true);
        const {
          data: { results: loadPolicy },
        } = await api.get('/config/booking');

        const policy = {
          lastday: loadPolicy.value.cancellationPolicyLastday,
          lastweek: loadPolicy.value.cancellationPolicyLastweek,
          lastmonth: loadPolicy.value.cancellationPolicyLastmonth,
          default: loadPolicy.value.cancellationPolicyDefault,
        };

        setPolicy(policy);
      } catch (error) {
        console.log(error);
      } finally {
        setPolicyLoading(false);
      }
    };
    if (user) {
      fetchPolicy();
    }
  }, [user]);

  if (!booking || error || !isBookingEnabled) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{`${bookingId} - ${t('cancel_booking_page_title')}`}</title>
        <meta name="description" content={t('cancel_booking_page_title')} />
        <meta property="og:type" content="booking" />
      </Head>
      {isCancelCompleted ? (
        <CancelCompleted />
      ) : (
        <CancelBooking
          bookingId={bookingId}
          policy={policy}
          isMember={isMember}
          refundTotal={refundTotal}
          isPolicyLoading={isPolicyLoading}
          setCancelCompleted={setCancelCompleted}
        />
      )}
    </>
  );
};

BookingCancelPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const { query } = context;
    const [bookingRes, bookingConfigRes, messages] = await Promise.all([
      api.get(`/booking/${query.slug}`).catch((err) => {
        console.error('Error fetching booking config:', err);
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;

    return { booking, bookingConfig, messages };
  } catch (err) {
    return {
      booking: null,
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default BookingCancelPage;
