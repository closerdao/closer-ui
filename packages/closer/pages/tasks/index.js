import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import Layout from '../../components/Layout';
import TaskList from '../../components/TaskList';


import { useAuth } from '../../contexts/auth.js';
import { __ } from '../../utils/helpers';

const Settings = ({ token }) => {
  const { user } = useAuth();

  return (
    <Layout protect>
      <Head>
        <title>{__('tasks_title')}</title>
      </Head>
      <main className="main-content intro">
        <div className="page-header">
          <h1>{__('tasks_title')}</h1>
          <div className="user-actions">
            <Link as="/tasks/create" href="/tasks/create" className="button">
              {__('tasks_link_create')}
            </Link>
          </div>
        </div>
        <TaskList />
      </main>
    </Layout>
  );
};

export default Settings;
