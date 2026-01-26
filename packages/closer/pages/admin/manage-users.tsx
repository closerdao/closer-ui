import Head from 'next/head';

import { useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import UsersFilter from '../../components/UsersFilter';
import UsersList from '../../components/UsersList';
import { Heading } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import useRBAC from '../../hooks/useRBAC';
import { BookingConfig } from '../../types/api';
import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const ManageUsersPage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const [where, setWhere] = useState({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('-created');

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const hasUserManagementAccess = hasAccess('UserManagement');

  if (!user || !hasUserManagementAccess) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('manage_users_heading')}</title>
      </Head>

      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <Heading level={2}>{t('manage_users_heading')}</Heading>
        
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <UsersFilter
            page={page}
            setPage={setPage}
            setWhere={setWhere}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>

        <UsersList
          where={where}
          page={page}
          setPage={setPage}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </AdminLayout>
    </>
  );
};

ManageUsersPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [messages, bookingRes] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      api.get('/config/booking').catch(() => null),
    ]);

    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      messages,
      bookingConfig,
    };
  } catch (err: unknown) {
    return {
      messages: null,
      bookingConfig: null,
    };
  }
};

export default ManageUsersPage;
