import Head from 'next/head';

import { useState } from 'react';

import UsersFilter from '../../components/UsersFilter';
import UsersList from '../../components/UsersList';
import { Heading } from '../../components/ui';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { __ } from '../../utils/helpers';

const ManageUsersPage = () => {
  const { user } = useAuth();
  const [where, setWhere] = useState({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('-created');

  if (!user || !user.roles.includes('admin')) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <div>
      <Head>
        <title>{__('manage_users_heading')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('manage_users_heading')}</Heading>
        <UsersFilter
          page={page}
          setPage={setPage}
          setWhere={setWhere}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <UsersList
          where={where}
          page={page}
          setPage={setPage}
          sortBy={sortBy}
        />
      </div>
    </div>
  );
};

export default ManageUsersPage;