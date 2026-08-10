import Head from 'next/head';

import EmailTemplatesLayout from '../../../components/EmailTemplates/EmailTemplatesLayout';
import { Heading } from '../../../components/ui';

import { Mail } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { BookingConfig } from '../../../types/api';
import { EmailTemplate } from '../../../types/emailTemplate';
import api from '../../../utils/api';
import config from '../../../configCached';
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
          <p className="text-sm max-w-sm">
            {t('admin_emails_select_template')}
          </p>
        </div>
      </EmailTemplatesLayout>
    </>
  );
};

EmailsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const emailsRes = await api.get('/emailtemplates?limit=100')

    const templates = emailsRes?.data?.results ?? [];
    const bookingConfig = config.booking;

    return {
      templates,
      bookingConfig,
    };
  } catch {
    return {
      templates: [],
      bookingConfig: null,
      };
  }
};

export default EmailsPage;
