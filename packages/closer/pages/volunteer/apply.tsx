import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import BookingBackButton from '../../components/BookingBackButton';
import PageError from '../../components/PageError';
import VolunteerApplicationForm from '../../components/VolunteerApplicationForm';
import Heading from '../../components/ui/Heading';
import Spinner from '../../components/ui/Spinner';

import config from '../../configCached';
import { useAuth } from '../../contexts/auth';
import { GeneralConfig, VolunteerConfig } from '../../types';
import { parseMessageFromError } from '../../utils/common';
import {
  default as PageNotAllowed,
  default as PageNotFound,
} from '../not-found';

interface Props {
  volunteerConfig: VolunteerConfig | null;
  generalConfig: GeneralConfig | null;
  error?: string;
}

const VolunteerApplicationPage = ({
  volunteerConfig,
  generalConfig,
  error,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  const PLATFORM_NAME = generalConfig?.platformName || '';
  const isVolunteerEnabled = volunteerConfig?.enabled;

  const {
    bookingType: bookingTypeQuery,
    start: startQuery,
    end: endQuery,
  } = router.query || {};

  const readParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  // `residence` comes from positions with residency: true; everything else is
  // an ordinary volunteer stay.
  const bookingType =
    readParam(bookingTypeQuery) === 'residence' ? 'residence' : 'volunteer';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  const goBack = () => {
    router.push('/volunteer');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!isVolunteerEnabled) {
    return <PageNotFound />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{`${t(
          'volunteer_application_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>
      <div className="w-full max-w-screen-sm mx-auto p-4 sm:p-8">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} />
        <Heading level={1} className="pb-4 mt-8">
          {t('volunteer_application_title')}
        </Heading>

        <VolunteerApplicationForm
          volunteerConfig={volunteerConfig}
          bookingType={bookingType}
          platformName={PLATFORM_NAME}
          start={readParam(startQuery)}
          end={readParam(endQuery)}
          onExit={goBack}
        />
      </div>
    </>
  );
};

VolunteerApplicationPage.getInitialProps = async (
  _context: NextPageContext,
) => {
  try {
    return {
      volunteerConfig: (config.volunteering || null) as VolunteerConfig | null,
      generalConfig: (config.general || null) as GeneralConfig | null,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      volunteerConfig: null,
      generalConfig: null,
    };
  }
};

export default VolunteerApplicationPage;
