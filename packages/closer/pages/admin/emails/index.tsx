import Head from 'next/head';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EmailTemplatesLayout from '../../../components/EmailTemplates/EmailTemplatesLayout';
import { Heading } from '../../../components/ui';

import { Mail } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { BookingConfig } from '../../../types/api';
import { EmailTemplate } from '../../../types/emailTemplate';
import { getConfig, getConfigValueBySlug } from '../../../utils/configCache';
import api from '../../../utils/api';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  templates: EmailTemplate[];
  bookingConfig: BookingConfig;
}

const EmailsPage = ({ templates, bookingConfig }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const hasPlatformSettingsAccess = hasAccess('PlatformSettings');

  if (!user || !hasPlatformSettingsAccess) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('admin_emails_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <EmailTemplatesLayout
        templates={templates}
        isBookingEnabled={isBookingEnabled}
      >
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-gray-500">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Mail className="w-12 h-12 text-gray-400" />
          </div>
          <Heading level={4} className="text-gray-600 mb-2">
            {t('admin_emails_title')}
          </Heading>
          <p className="text-sm max-w-sm">{t('admin_emails_select_template')}</p>
        </div>
      </EmailTemplatesLayout>
    </>
  );
};

EmailsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [emailsRes, configs, messages] = await Promise.all([
      api.get('/emailtemplates?limit=100'),
      getConfig(api),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const templates = emailsRes?.data?.results ?? [];
    const bookingConfig = getConfigValueBySlug(configs, 'booking');

    return {
      templates,
      bookingConfig,
      messages,
    };
  } catch {
    return {
      templates: [],
      bookingConfig: null,
      messages: null,
    };
  }
};

export default EmailsPage;
