import Head from 'next/head';
import { useRouter } from 'next/router';

import BookingBackButton from '../../components/BookingBackButton';
import PageError from '../../components/PageError';
import VolunteerOrResidenceApplication from '../../components/VolunteerOrResidenceApplication/VolunteerOrResidenceApplication';
import Heading from '../../components/ui/Heading';
import ProgressBar from '../../components/ui/ProgressBar';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { BOOKING_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { GeneralConfig, VolunteerConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import {
  default as PageNotAllowed,
  default as PageNotFound,
} from '../not-found';

interface Props {
  volunteerConfig: VolunteerConfig | null;
  error: string | null;
  generalConfig: GeneralConfig | null;
}

const VolunteerApplicationPage = ({
  volunteerConfig,
  error,
  generalConfig,
}: Props) => {
  const PLATFORM_NAME = generalConfig?.platformName || '';

  const t = useTranslations();

  const isVolunteerEnabled = volunteerConfig?.enabled;

  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const goBack = () => {
    router.push('/volunteer');
  };

  if (!isVolunteerEnabled) {
    return <PageNotFound />;
  }

  if (error) {
    return <PageError error={error} />;
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

VolunteerApplicationPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalConfigRes, volunteerConfigRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      api.get('/config/volunteering').catch(() => {
        return null;
      }),

      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const volunteerConfig = volunteerConfigRes?.data?.results?.value || null;
    const generalConfig = generalConfigRes?.data?.results?.value || null;

    return {
      volunteerConfig,
      generalConfig,
      messages,
    };
  } catch (err) {
    console.error('Error', err);
    return {
      error: parseMessageFromError(err),
      volunteerConfig: null,
      generalConfig: null,
      messages: null,
    };
  }
};

export default VolunteerApplicationPage;
