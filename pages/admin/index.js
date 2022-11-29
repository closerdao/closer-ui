import Head from 'next/head';

import React, { useState } from 'react';

import Layout from '../../components/Layout';
import Loading from '../../components/Loading';
import Tabs from '../../components/Tabs';
import UsersTable from '../../components/UsersTable';
import Dashboard from '../../components/admin/Dashboard';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const Admin = () => {
  const { user, isLoading } = useAuth();
  const [error, setError] = useState(null);

  if (isLoading) {
    return <Loading />;
  }
  if (!user || !user.roles.includes('admin')) {
    return <PageNotAllowed />;
  }

  return (
    <Layout protect>
      <Head>
        <title>{__('admin_title')}</title>
      </Head>
      <main className="main-content center intro">
        { error && <div className="error">{ error }</div> }
        <Tabs
          tabs={[
            {
              title: __('admin_dashboard_tile'),
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
    </Layout>
  );
};

export default Admin;
