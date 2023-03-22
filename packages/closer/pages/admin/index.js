import Head from 'next/head';

import React from 'react';

import Loading from '../../components/Loading';
import Tabs from '../../components/Tabs';
import UsersTable from '../../components/UsersTable';
import Dashboard from '../../components/admin/Dashboard';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const Admin = () => {
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
        <title>{__('admin_title')}</title>
      </Head>
      <main className="main-content w-full">
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
    </>
  );
};

export default Admin;
