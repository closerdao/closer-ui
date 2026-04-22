import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { CohousingParticipantView } from '../../../components/cohousing/cohousingParticipantView';
import Heading from '../../../components/ui/Heading';
import Spinner from '../../../components/ui/Spinner';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import type { CohousingApplication } from '../../../types/cohousingApplication';
import api from '../../../utils/api';
import { loadLocaleData } from '../../../utils/locale.helpers';

const CohousingApplicationDetailPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const [application, setApplication] = useState<CohousingApplication | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isTeamUser = Boolean(user?.roles?.includes('team'));

  const load = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/cohousingapplication/${id}`);
      setApplication(data.results as CohousingApplication);
    } catch {
      setError(t('cohousing_app_load_error'));
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (router.isReady && id) {
      load();
    }
  }, [router.isReady, id, load]);

  const handlePersist = useCallback(
    async (data: Record<string, unknown>) => {
      await platform.cohousingapplication.patchMine(data);
      await load();
    },
    [platform, load],
  );

  if (!user) {
    return (
      <>
        <Head>
          <title>{t('cohousing_app_page_title')}</title>
        </Head>
        <main className="main-content w-full max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-gray-700 mb-6">{t('cohousing_app_login_prompt')}</p>
          <a
            href={`/login?redirect=${encodeURIComponent(
              typeof id === 'string'
                ? `/cohousing/application/${id}`
                : '/cohousing/application',
            )}`}
            className="text-accent font-medium underline"
          >
            {t('cohousing_app_login_cta')}
          </a>
        </main>
      </>
    );
  }

  if (!router.isReady || loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error || !application) {
    return (
      <>
        <Head>
          <title>{t('cohousing_app_page_title')}</title>
        </Head>
        <main className="main-content w-full max-w-2xl mx-auto px-4 py-16 text-center text-gray-700">
          {isTeamUser && typeof id === 'string' && (
            <p className="mb-4">
              <Link href={`/cohousing/application/${id}/admin`} className="text-accent underline font-medium">
                {t('cohousing_app_admin_link')}
              </Link>
            </p>
          )}
          {error || t('cohousing_app_not_found')}
        </main>
      </>
    );
  }

  const createdById =
    typeof application.createdBy === 'string'
      ? application.createdBy
      : application.createdBy?._id;
  if (user._id && createdById && createdById !== user._id) {
    return (
      <>
        <Head>
          <title>{t('cohousing_app_page_title')}</title>
        </Head>
        <main className="main-content w-full max-w-lg mx-auto px-4 py-16 text-center text-gray-700">
          {typeof id === 'string' && isTeamUser && (
            <p className="mb-4">
              <Link href={`/cohousing/application/${id}/admin`} className="text-accent underline font-medium">
                {t('cohousing_app_admin_link')}
              </Link>
            </p>
          )}
          {t('cohousing_app_forbidden')}
        </main>
      </>
    );
  }

  if (application.status === 'waitlist') {
    return (
      <>
        <Head>
          <title>{t('cohousing_app_page_title')}</title>
        </Head>
        <main className="main-content w-full max-w-2xl mx-auto px-4 py-16 text-center">
          {typeof id === 'string' && isTeamUser && (
            <p className="mb-4">
              <Link href={`/cohousing/application/${id}/admin`} className="text-accent underline font-medium">
                {t('cohousing_app_admin_link')}
              </Link>
            </p>
          )}
          <Heading
            level={1}
            className="text-2xl md:text-3xl font-normal text-gray-900 text-center max-w-2xl mx-auto mb-3"
          >
            {t('cohousing_app_waitlist_title')}
          </Heading>
          <p className="text-gray-700 leading-relaxed mb-4">
            {t('cohousing_app_waitlist_thank_you')}
          </p>
          <p className="text-gray-700 leading-relaxed mb-8">
            {t('cohousing_app_waitlist_pending_message')}
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            {t('cohousing_app_waitlist_visit_note')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/stay"
              className="inline-block px-5 py-2.5 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
            >
              {t('cohousing_app_waitlist_visit_cta')}
            </Link>
            <Link
              href="/citizenship"
              className="inline-block px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
            >
              {t('cohousing_app_waitlist_citizen_cta')}
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('cohousing_app_page_title')}</title>
      </Head>
      <div className="main-content w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {typeof id === 'string' && isTeamUser && (
          <div className="mb-5">
            <Link href={`/cohousing/application/${id}/admin`} className="text-accent underline font-medium">
              {t('cohousing_app_admin_link')}
            </Link>
          </div>
        )}
        <CohousingParticipantView
          application={application}
          onPersist={handlePersist}
        />
      </div>
    </>
  );
};

export default CohousingApplicationDetailPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      messages: await loadLocaleData(locale as string, 'tdf'),
    },
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}
