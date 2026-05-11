import Head from 'next/head';
import { useRouter } from 'next/router';

import BookingBackButton from '../../components/BookingBackButton';
import VolunteerOrResidenceApplication from '../../components/VolunteerOrResidenceApplication/VolunteerOrResidenceApplication';
import Heading from '../../components/ui/Heading';
import ProgressBar from '../../components/ui/ProgressBar';

import { useTranslations } from 'next-intl';

import { BOOKING_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { GeneralConfig, VolunteerConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import {
  default as PageNotAllowed,
  default as PageNotFound,
} from '../not-found';
import { useEffect } from 'react';

const VolunteerApplicationPage = () => {
  const volunteerConfig = getCachedConfig('volunteering') as VolunteerConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const PLATFORM_NAME = generalConfig?.platformName || '';

  const t = useTranslations();

  const isVolunteerEnabled = volunteerConfig?.enabled;

  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  const goBack = () => {
    router.push('/volunteer');
  };

  if (!isVolunteerEnabled) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{`${t(
          'projects_application_title',
        )} - ${PLATFORM_NAME}!`}</title>
      </Head>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={goBack} name={t('buttons_back')} />
        <Heading level={1} className="pb-4 mt-8">
          {t('projects_application_title')}
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />

        <VolunteerOrResidenceApplication
          volunteerConfig={volunteerConfig}
          type="volunteer"
        />
      </div>
    </>
  );
};

export default VolunteerApplicationPage;
