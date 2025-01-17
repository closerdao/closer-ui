import Head from 'next/head';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import { Heading } from '../../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  generalConfig: GeneralConfig;
  error?: string;
}

const PerformancePage = ({ generalConfig }: Props) => {
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
        <title>{`${t(
          'dashboard_performance_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>
      <AdminLayout>
        <div className="flex justify-between flex-col md:flex-row gap-4">
          <Heading level={2}>{t('dashboard_performance_title')}</Heading>
        </div>
      </AdminLayout>
    </>
  );
};

PerformancePage.getInitialProps = async (context: NextPageContext) => {
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

export default PerformancePage;
