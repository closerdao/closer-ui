import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageError from '../../../components/PageError';
import { ErrorMessage } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { BookingSettings, GeneralConfig } from '../../../types/api';
import { Stay } from '../../../types/stay';
import { parseMessageFromError } from '../../../utils/common';
import {
  getStay,
  isStayAwaitingPayment,
  isStayPaid,
  isStayTerminal,
} from '../../../utils/stays.api';

interface Props {
  bookingSettings: BookingSettings | null;
  generalConfig: GeneralConfig | null;
  error?: string;
  messages?: any;
}

const StayPendingPage = ({
  bookingSettings,
  generalConfig,
  error,
}: Props) => {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const idParam = router.query.slug ?? router.query.id;
  const stayId = typeof idParam === 'string' ? idParam : idParam?.[0];

  const isBookingEnabled =
    !!bookingSettings && process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [stay, setStay] = useState<Stay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !stayId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const next = await getStay(stayId);
        if (cancelled) return;
        setStay(next);
      } catch (err) {
        if (!cancelled) setPageError(parseMessageFromError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, stayId]);

  if (error) return <PageError error={error} />;
  if (!isBookingEnabled) return <FeatureNotEnabled feature="booking" />;

  const pageTitle = `${t('stay_pending_page_meta_title')} - ${PLATFORM_NAME}`;

  const SeoHead = (
    <Head>
      <title>{pageTitle}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta
        name="description"
        content={t('stay_pending_page_meta_description')}
      />
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
        </main>
      </>
    );
  }

  if (isLoading) {
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
  }

  if (pageError || !stay) {
    return (
      <>
        {SeoHead}
        <main
          id="main-content"
          className="w-full max-w-screen-sm mx-auto p-4 md:p-6"
        >
          <div role="alert" aria-live="assertive">
            <ErrorMessage error={pageError || t('stay_create_not_found')} />
          </div>
        </main>
      </>
    );
  }

  if (isStayPaid(stay)) {
    if (typeof window !== 'undefined') {
      router.replace(`/stay/${stay._id}/confirmation`);
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
  }

  if (stay.status === 'draft' || isStayAwaitingPayment(stay)) {
    if (typeof window !== 'undefined') {
      router.replace(`/stay/create/${stay._id}`);
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
  }

  if (isStayTerminal(stay)) {
    if (typeof window !== 'undefined') {
      router.replace(`/stay/${stay._id}`);
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
  }

  if (stay.status !== 'pending') {
    if (typeof window !== 'undefined') {
      router.replace(`/stay/${stay._id}`);
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
  }

  return (
    <>
      {SeoHead}
      <main
        id="main-content"
        className="w-full max-w-screen-sm mx-auto p-4 md:p-6 py-12 text-center"
      >
        <div
          aria-hidden="true"
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/10 mb-5"
        >
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            focusable="false"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <Heading level={1} className="text-2xl md:text-3xl mb-4">
          {t('stay_pending_page_title')}
        </Heading>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {t('stay_pending_page_description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={() => router.push(`/stay/${stay._id}`)}
            isFullWidth={false}
            className="px-8 min-h-[44px]"
            variant="secondary"
          >
            {t('stay_create_view_booking')}
          </Button>
          <Button
            onClick={() => router.push('/stay/create')}
            isFullWidth={false}
            className="px-8 min-h-[44px]"
          >
            {t('stay_create_book_another')}
          </Button>
        </div>
      </main>
    </>
  );
};

StayPendingPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingSettings = config.booking as BookingSettings;
    const generalConfig = (config.general || null) as GeneralConfig | null;
    return { bookingSettings, generalConfig };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingSettings: null,
      generalConfig: null,
      };
  }
};

export default StayPendingPage;
