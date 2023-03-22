import Head from 'next/head';

import React from 'react';

import MemberList from '../../components/MemberList';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const Settings = () => {
  const { user } = useAuth();

  if (!user) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{__('members_title')}</title>
      </Head>
      <div className="main-content fullheight">
        <MemberList />
      </div>
    </>
  );
};

export default Settings;
