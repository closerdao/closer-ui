import Head from 'next/head';

import React from 'react';

import MemberList from '../../components/MemberList';

import { __ } from '../../utils/helpers';

const MembersPage = () => {

  return (
    <>
      <Head>
        <title>{__('members_title')}</title>
      </Head>
      <div className="main-content fullheight">
        <MemberList filter={{ roles: 'member' }} />
      </div>
    </>
  );
};

export default MembersPage;
