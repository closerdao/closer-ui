import Head from 'next/head';
import Link from 'next/link';

import { useEffect } from 'react';

import FoodListPreview from '../../components/FoodListPreview';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';
import AdminLayout from '../../components/Dashboard/AdminLayout';
import api from '../../utils/api';
import { BookingConfig } from '../../types/api';

const FoodPage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
  const t = useTranslations();

  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const isSpaceHost = user?.roles.includes('space-host');
  const isAdmin = user?.roles.includes('admin');
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const foodFilter = {
    where: {},
  };

  const foodOptions = platform.food.find(foodFilter);

  const loadData = async () => {
    await Promise.all([platform.food.get(foodFilter)]);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!isSpaceHost && !isAdmin) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <>
      <Head>
        <title>{t('food_edit_title')}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        {foodOptions?.get('error') && (
          <div className="validation-error">{foodOptions.get('error')}</div>
        )}
        <section className="text-center flex flex-wrap mb-12 ">
          <div className="md:max-w-5xl">
            <div className="mb-6 flex justify-between flex-col sm:flex-row gap-4">
              <Heading>{t('food_edit_title')}</Heading>
              {(user?.roles.includes('admin') ||
                user?.roles.includes('space-host')) && (
                <div className="user-actions">
                  <Link
                    as="/food/create"
                    href="/food/create"
                    className="btn-primary"
                  >
                    {t('listings_create')}
                  </Link>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-4 gap-x-12 md:gap-x-5 gap-y-16">
              {foodOptions &&
                foodOptions.count() > 0 &&
                user &&
                foodOptions.map((food: any) => {
                  return <FoodListPreview key={food.get('_id')} food={food} />;
                })}
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

FoodPage.getInitialProps = async (context: NextPageContext) => {
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
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
    };
  }
};

export default FoodPage;
