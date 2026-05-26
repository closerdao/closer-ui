import Head from 'next/head';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import { CohousingDashboardView } from '../../../components/cohousing/cohousingDashboardView';
import { useAuth } from '../../../contexts/auth';
import PageNotAllowed from '../../401';

const isCohousingAdminRole = (roles: string[] | undefined) =>
  Boolean(
    roles?.includes('admin') ||
      roles?.includes('community-curator') ||
      roles?.includes('team'),
  );

const CohousingDashboardDetailPage = () => {
  const t = useTranslations();
  const { user } = useAuth();

  if (!user || !isCohousingAdminRole(user.roles)) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('cohousing_team_page_title')}</title>
      </Head>
      <AdminLayout>
        <CohousingDashboardView />
      </AdminLayout>
    </>
  );
};

export default CohousingDashboardDetailPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {},
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}
