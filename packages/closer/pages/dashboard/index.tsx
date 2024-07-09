import Head from 'next/head';

import { Heading } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';
import DashboardBookings from '../../components/Dashboard/DashboardBookings';
import DashboardRevenue from '../../components/Dashboard/DashboardRevenue';

interface Props {
  generalConfig: GeneralConfig;
  error?: string;
}

const DashboardPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();

  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  if (!user || !isAdmin) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('dashboard_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <div className="flex min-h-screen">
        <nav className="w-[60px] lg:w-[200px] flex-shrink-0 border">navbar</nav>
        <main className="bg-neutral-light flex-grow px-6 py-8 flex flex-col gap-4">
          <Heading level={2}>{t('dashboard_title')}</Heading>

          <DashboardBookings />

          <DashboardRevenue />


        </main>
      </div>
    </>
  );
};

DashboardPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      messages,
    };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      generalConfig: null,
      messages: null,
    };
  }
};

export default DashboardPage;
