import Head from 'next/head';

import Link from 'next/link';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EmailTemplateEditor from '../../../components/EmailTemplates/EmailTemplateEditor';
import EmailTemplatesLayout from '../../../components/EmailTemplates/EmailTemplatesLayout';
import { Button } from '../../../components/ui';

import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
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
  template: EmailTemplate | null;
  templates: EmailTemplate[];
  templateVariables: string[];
  bookingConfig: BookingConfig;
}

const buildSampleTemplateData = (variables: string[]): Record<string, unknown> => {
  const data: Record<string, unknown> = {
    PLATFORM_NAME: 'Traditional Dream Factory',
  };
  const parentsWithNested = new Set(
    variables.filter((v) => v.includes('.')).map((v) => v.split('.')[0]),
  );
  for (const v of variables) {
    if (v === 'PLATFORM_NAME') continue;
    if (v.includes('.')) {
      const [parent, child] = v.split('.');
      const existing = data[parent];
      const parentObj =
        existing && typeof existing === 'object' && !Array.isArray(existing)
          ? (existing as Record<string, unknown>)
          : {};
      parentObj[child] = `sample_${child}`;
      data[parent] = parentObj;
    } else if (!parentsWithNested.has(v)) {
      data[v] = `sample_${v}`;
    }
  }
  return data;
};

const EmailEditorPage = ({
  template,
  templates,
  templateVariables,
  bookingConfig,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const slug = router.query.slug as string;

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const hasPlatformSettingsAccess = hasAccess('PlatformSettings');
  const isAdminOrTeam =
    user?.roles?.includes('admin') || user?.roles?.includes('team');

  if (!user || !hasPlatformSettingsAccess) {
    return <PageNotFound error="User may not access" />;
  }

  if (!template) {
    return (
      <AdminLayout>
        <p>{t('admin_emails_template_not_found')}</p>
        <Link href="/dashboard/admin/emails">
          <Button variant="secondary">{t('admin_emails_back_to_list')}</Button>
        </Link>
      </AdminLayout>
    );
  }

  const templateData = buildSampleTemplateData(templateVariables);

  const handleSave = async (data: Partial<EmailTemplate>) => {
    await api.patch(`/emailtemplate/${slug}`, data);
    router.replace(router.asPath);
  };

  const renderEmail = async (
    templateDataPayload: Record<string, unknown>,
    sendToMe: boolean,
  ) => {
    const res = sendToMe
      ? await api.post(`/emails/render/${slug}`, {
          templateData: templateDataPayload,
          sendToMe: true,
        })
      : await api.post(`/emails/render/${slug}`, {
          templateData: templateDataPayload,
        });
    return res.data?.html ?? '';
  };

  const handlePreview = (templateDataPayload: Record<string, unknown>) =>
    renderEmail(templateDataPayload, false);

  const handleSendToMe = (templateDataPayload: Record<string, unknown>) =>
    renderEmail(templateDataPayload, true);

  return (
    <>
      <Head>
        <title>{t('admin_emails_edit_title', { name: template.name })}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <EmailTemplatesLayout
        templates={templates}
        heading={template.name}
        isBookingEnabled={isBookingEnabled}
      >
        <EmailTemplateEditor
          key={template.slug}
          template={template}
          templateData={templateData}
          onSave={handleSave}
          onPreview={handlePreview}
          onSendToMe={handleSendToMe}
          isAdminOrTeam={!!isAdminOrTeam}
        />
      </EmailTemplatesLayout>
    </>
  );
};

EmailEditorPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const slug = context.query.slug as string;
    if (!slug) {
      return {
        template: null,
        templates: [],
        templateVariables: [],
        bookingConfig: null,
        messages: null,
      };
    }

    const [emailsRes, varsRes, configs, messages] = await Promise.all([
      api.get('/emailtemplates?limit=100'),
      api.get('/emails/template-variables').catch(() => ({ data: { results: [] } })),
      getConfig(api),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const templates: EmailTemplate[] = emailsRes?.data?.results ?? [];
    const template = templates.find((t) => t.slug === slug) ?? null;
    const templateVariables = varsRes?.data?.results ?? [];
    const bookingConfig = getConfigValueBySlug(configs, 'booking');

    return {
      template,
      templates,
      templateVariables,
      bookingConfig,
      messages,
    };
  } catch {
    return {
      template: null,
      templates: [],
      templateVariables: [],
      bookingConfig: null,
      messages: null,
    };
  }
};

export default EmailEditorPage;
