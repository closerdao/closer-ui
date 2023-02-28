import Head from 'next/head';

import React from 'react';

import Layout from '../../components/Layout';
import MemberList from '../../components/MemberList';


import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth.js';
import { __ } from '../../utils/helpers';

const Settings = ({ token }) => {
  const { user } = useAuth();

  if (!user) {
    return <PageNotAllowed />;
  }

  return (
    <Layout protect>
      <Head>
        <title>{__('members_title')}</title>
      </Head>
      <div className="main-content fullheight">
        <MemberList />
      </div>
    </Layout>
  );
};

export default Settings;
