import Head from 'next/head';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import PageEditor from '../../../components/PageEditor/PageEditor';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import type { PageDoc } from '../../../types/page';
import api from '../../../utils/api';
import PageNotFound from '../../not-found';

interface Props {
  initialPage: PageDoc | null;
  pages: { _id: string; title?: string; slug?: string }[];
}

const DashboardPagesEdit = ({ initialPage, pages }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();

  if (!user || !hasAccess('PlatformSettings')) {
    return <PageNotFound error="User may not access" />;
  }

  if (!initialPage) {
    return (
      <AdminLayout>
        <p className="p-4">{t('pages_editor_page_not_found')}</p>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{t('pages_editor_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <PageEditor initialPage={initialPage} pages={pages} />
    </>
  );
};

DashboardPagesEdit.getInitialProps = async (context: NextPageContext) => {
  const id = context.query?.id as string | undefined;
  if (!id) {
    return { initialPage: null, pages: [] };
  }
  try {
    const [oneRes, listRes] = await Promise.all([
      api.get(`/page/${id}`).catch(() => null),
      api.get('/page', { params: { limit: 100 } }).catch(() => ({ data: {} })),
    ]);
    const raw = oneRes?.data?.results;
    const list = listRes?.data?.results ?? [];
    if (!raw) {
      return { initialPage: null, pages: list };
    }
    const initialPage: PageDoc = {
      _id: String(raw._id ?? id),
      title: String(raw.title ?? ''),
      slug: String(raw.slug ?? '/'),
      description: raw.description != null ? String(raw.description) : '',
      ogImage: raw.ogImage != null ? String(raw.ogImage) : '',
      sections: Array.isArray(raw.sections) ? raw.sections : [],
    };
    return { initialPage, pages: list };
  } catch {
    return { initialPage: null, pages: [] };
  }
};

export default DashboardPagesEdit;
