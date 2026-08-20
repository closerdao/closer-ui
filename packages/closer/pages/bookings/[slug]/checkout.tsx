import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { ErrorMessage } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import { parseMessageFromError } from '../../../utils/common';
import { getBookingPaymentCheckoutPath } from '../../../utils/booking.helpers';
import { normalizeIsFriendsBooking } from '../../../utils/bookingUtils';
import {
  computeCreditsOwed,
  computeFiatOwed,
  computeTokensOwed,
  getStay,
} from '../../../utils/stays.api';

/**
 * The stay flow replaced this checkout. Confirmation emails and bookmarks still
 * point here, so the route survives only to send the guest on to whichever stay
 * page owns the booking's next step.
 */
const BookingCheckoutRedirectPage = () => {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated } = useAuth();

  const slugParam = router.query.slug;
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0];
  const isFriend = normalizeIsFriendsBooking(router.query.isFriend);

  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !slug || !isAuthenticated) return;

    // An invited friend cannot read the stay until they have claimed it, and
    // the claim lives on the stay checkout page — send them straight there.
    if (isFriend) {
      void router.replace(`/stay/create/${slug}?isFriend=true`);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const stay = await getStay(slug);
        if (cancelled) return;
        void router.replace(
          getBookingPaymentCheckoutPath({
            bookingId: stay._id,
            status: String(stay.status ?? ''),
            paymentDelta: stay.paymentDelta,
            useTokens: Boolean(stay.useTokens),
            fiatOwed: computeFiatOwed(stay),
            tokensOwed: computeTokensOwed(stay),
            creditsOwed: computeCreditsOwed(stay),
          }),
        );
      } catch (err) {
        if (!cancelled) setRedirectError(parseMessageFromError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug, isFriend, isAuthenticated, router]);

  const SeoHead = (
    <Head>
      <title>{t('bookings_checkout_step_payment_title')}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Head>
  );

  if (!isAuthenticated) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6 text-center"
        >
          <Heading level={1} className="text-2xl md:text-3xl">
            {t('stay_create_login_required_title')}
          </Heading>
          <p className="mt-3 text-muted-foreground">
            {t('stay_create_login_required_description')}
          </p>
          <Button
            className="mt-6 min-h-[44px]"
            isFullWidth={false}
            onClick={() => router.push('/login')}
          >
            {t('login_title')}
          </Button>
        </main>
      </>
    );
  }

  if (redirectError) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6"
        >
          <ErrorMessage error={redirectError} />
          <Button
            className="mt-4 min-h-[44px]"
            isFullWidth={false}
            onClick={() => router.push('/stay')}
          >
            {t('stay_create_back_to_search')}
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      {SeoHead}
      <main
        id="main-content"
        className="flex justify-center py-24"
        role="status"
        aria-label={t('stay_create_loading')}
      >
        <Spinner />
        <span className="sr-only">{t('stay_create_loading')}</span>
      </main>
    </>
  );
};

export default BookingCheckoutRedirectPage;
