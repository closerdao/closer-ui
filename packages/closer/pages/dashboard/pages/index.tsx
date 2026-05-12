import Head from 'next/head';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import NewPageDialog, {
  NewPageData,
  buildNewPagePayload,
} from '../../../components/PageEditor/NewPageDialog';
import { Button, Heading } from '../../../components/ui';

import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import useRBAC from '../../../hooks/useRBAC';
import api from '../../../utils/api';
import PageNotFound from '../../not-found';

function toPlain<T>(x: T): T {
  if (x != null && typeof (x as { toJS?: () => T }).toJS === 'function') {
    return (x as { toJS: () => T }).toJS();
  }
  return x;
}

interface Props {
  pages: { _id: string; title?: string; slug?: string }[];
}

const DashboardPagesIndex = ({ pages }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform } = usePlatform();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pages?.length > 0) {
      void router.replace(`/dashboard/pages/${pages[0]._id}`);
    }
  }, [pages, router]);

  const handleCreate = async (data: NewPageData) => {
    try {
      setIsSubmitting(true);
      const payload = buildNewPagePayload(data);
      const action = (await platform.page.post(payload)) as
        | { results?: unknown; error?: unknown }
        | undefined;
      if (action?.error) return;
      const created = toPlain(action?.results) as { _id?: string } | undefined;
      const id = created?._id;
      setDialogOpen(false);
      if (id) await router.push(`/dashboard/pages/${id}`);
    } finally {
      setIsSubmitting(false);
    }
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
          <Button type="button" onClick={() => setDialogOpen(true)}>
            {t('pages_editor_create_first')}
          </Button>
        </div>
      </AdminLayout>
      <NewPageDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        isSubmitting={isSubmitting}
        onCreate={handleCreate}
      />
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
