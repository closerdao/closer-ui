import Head from 'next/head';
import { useEffect } from 'react';

import { useRouter } from 'next/router';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import { Button, Heading } from '../../../components/ui';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import api from '../../../utils/api';
import PageNotFound from '../../not-found';

interface Props {
  pages: { _id: string; title?: string; slug?: string }[];
}

const DashboardPagesIndex = ({ pages }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();

  useEffect(() => {
    if (pages?.length > 0) {
      void router.replace(`/dashboard/pages/${pages[0]._id}`);
    }
  }, [pages, router]);

  const createFirst = async () => {
    const slug = `/untitled-${Math.floor(Math.random() * 99999)}`;
    const res = await api.post('/page', {
      title: 'Untitled',
      slug,
      description: '',
      ogImage: '',
      sections: [],
    });
    const id = res.data?.results?._id;
    if (id) await router.push(`/dashboard/pages/${id}`);
  };

  if (!user || !hasAccess('PlatformSettings')) {
    return <PageNotFound error="User may not access" />;
  }

  if (pages?.length > 0) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-500 text-sm">{t('pages_editor_redirecting')}</div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{t('pages_editor_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
          <Heading level={3}>{t('pages_editor_empty_list_title')}</Heading>
          <p className="text-sm text-gray-600 max-w-md">{t('pages_editor_empty_list_body')}</p>
          <Button type="button" onClick={() => void createFirst()}>
            {t('pages_editor_create_first')}
          </Button>
        </div>
      </AdminLayout>
    </>
  );
};

DashboardPagesIndex.getInitialProps = async (context: NextPageContext) => {
  try {
    const res = await api.get('/page', { params: { limit: 100 } });
    const pages = res?.data?.results ?? [];
    if (typeof window === 'undefined' && context.res && pages.length > 0) {
      const firstId = pages[0]._id;
      context.res.writeHead(302, { Location: `/dashboard/pages/${firstId}` });
      context.res.end();
    }
    return { pages };
  } catch {
    return { pages: [] };
  }
};

export default DashboardPagesIndex;
