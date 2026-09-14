import Head from 'next/head';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import PageEditor from '../../../components/PageEditor/PageEditor';

import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import type { PageDoc } from '../../../types/page';
import { resolveEditorRouteParam } from '../../../constants/standardPages';
import api from '../../../utils/api';
import { resolveStandardOrDbPage } from '../../../utils/standardPages';
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
      <AdminLayout flush>
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
    const decodedId = resolveEditorRouteParam(id);
    const [page, listRes] = await Promise.all([
      resolveStandardOrDbPage(decodedId, { context: 'editor' }),
      api.get('/page', { params: { limit: 200 } }).catch(() => ({ data: {} })),
    ]);
    const list = listRes?.data?.results ?? [];
    return { initialPage: page, pages: list };
  } catch {
    return { initialPage: null, pages: [] };
  }
};

export default DashboardPagesEdit;
