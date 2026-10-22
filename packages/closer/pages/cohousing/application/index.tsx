import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import Spinner from '../../../components/ui/Spinner';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import type { CohousingApplication } from '../../../types/cohousingApplication';
import { fetchMyCohousingApplications } from '../../../utils/cohousingApplications';

const CohousingApplicationIndexPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [busy, setBusy] = useState(true);
  const [multi, setMulti] = useState<CohousingApplication[]>([]);

  useEffect(() => {
    if (!user) {
      setBusy(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const raw = await fetchMyCohousingApplications();
        const apps = Array.isArray(raw) ? raw : [];
        if (cancelled) {
          return;
        }
        if (apps.length === 1) {
          await router.replace(`/cohousing/application/${apps[0]._id}`);
          return;
        }
        if (apps.length > 1) {
          setMulti(apps);
          setBusy(false);
          return;
        }
      } catch {
        if (!cancelled) {
          setBusy(false);
        }
        return;
      }
      if (!cancelled) {
        setBusy(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user, router]);

  if (!user) {
    return (
      <>
        <Head>
          <title>{t('cohousing_app_page_title')}</title>
        </Head>
        <main className="main-content w-full max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-gray-700 mb-6">
            {t('cohousing_app_login_prompt')}
          </p>
          <a
            href={`/login?redirect=${encodeURIComponent('/cohousing/application')}`}
            className="text-accent font-medium underline"
          >
            {t('cohousing_app_login_cta')}
          </a>
        </main>
      </>
    );
  }

  if (busy) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (multi.length > 1) {
    return (
      <>
        <Head>
          <title>{t('cohousing_app_page_title')}</title>
        </Head>
        <main className="main-content w-full max-w-lg mx-auto px-4 py-16">
          <p className="text-gray-700 mb-4">
            {t('cohousing_app_pick_application')}
          </p>
          <ul className="space-y-2">
            {multi.map((app) => (
              <li key={app._id}>
                <a
                  href={`/cohousing/application/${app._id}`}
                  className="block p-4 rounded-xl border border-gray-200 hover:border-accent transition-colors text-accent font-medium"
                >
                  {app._id}
                </a>
              </li>
            ))}
          </ul>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('cohousing_app_page_title')}</title>
      </Head>
      <main className="main-content w-full max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-700">{t('cohousing_app_no_application')}</p>
        <Link
          href="/cohousing"
          className="inline-block text-accent font-medium underline"
        >
          {t('cohousing_app_back_cohousing')}
        </Link>
      </main>
    </>
  );
};

export default CohousingApplicationIndexPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {},
  };
}
