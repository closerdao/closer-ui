import Head from 'next/head';

import { useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import UsersFilter from '../../components/UsersFilter';
import UsersList from '../../components/UsersList';
import { Heading } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';
import api from '../../utils/api';
import { BookingConfig } from '../../types/api';

const ManageUsersPage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [where, setWhere] = useState({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('-created');

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  if (!user || !user.roles.includes('admin')) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <div>
      <Head>
        <title>{t('manage_users_heading')}</title>
      </Head>

      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="max-w-screen-lg flex flex-col gap-2">
          <Heading level={1}>{t('manage_users_heading')}</Heading>
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
            setSortBy={setSortBy}
          />
        </div>
      </AdminLayout>
    </div>
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
