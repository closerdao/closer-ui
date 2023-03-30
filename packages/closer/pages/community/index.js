import Head from 'next/head';

import React from 'react';

import MemberHome from '../../components/MemberHome';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const Home = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{__('community_title')}</title>
      </Head>
      <MemberHome />
    </>
  );
};

export default Home;
