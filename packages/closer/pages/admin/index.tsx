import Head from 'next/head';

import Loading from '../../components/Loading';
import Tabs from '../../components/Tabs';
import UsersTable from '../../components/UsersTable';
import Dashboard from '../../components/admin/Dashboard';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { loadLocaleData } from '../../utils/locale.helpers';

const Admin = () => {
  const t = useTranslations();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }
  if (!user || !user.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('admin_title')}</title>
      </Head>
      <main className="main-content w-full">
        <Tabs
          tabs={[
            {
              title: t('admin_dashboard_tile'),
              value: 'dashboard',
              content: <Dashboard />,
            },
            {
              title: 'Users',
              value: 'users',
              content: <UsersTable />,
            },
          ]}
        />
      </main>
    </>
  );
};

Admin.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default Admin;
