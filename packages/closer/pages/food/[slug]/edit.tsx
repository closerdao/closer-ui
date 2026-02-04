import Head from 'next/head';
import { useRouter } from 'next/router';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  food: any;
  bookingConfig: any;
}

const EditFood = ({ food, bookingConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const onUpdate = async (
    name: any,
    value: any,
    option: any,
    actionType: any,
  ) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/food/${food._id}/add`, option);
    }
  };

  if (!food) {
    return <Heading>{t('foods_slug_edit_error')}</Heading>;
  }

  return (
    <>
      <Head>
        <title>{`${food.name} - ${t('listings_slug_edit_title')}`}</title>
      </Head>
      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <EditModelPageLayout
          title={`${t('food_edit_option')} ${food.name}`}
          backHref="/food"
          isEdit
        >
          <EditModel
            id={food._id}
            endpoint={'/food'}
            fields={models.food}
            onSave={() => router.push('/food')}
            onUpdate={(name, value, option, actionType) =>
              onUpdate(name, value, option, actionType)
            }
            allowDelete
            deleteButton={t('food_delete_option')}
            onDelete={() => router.push('/food')}
          />
        </EditModelPageLayout>
      </AdminLayout>
    </>
  );
};

EditFood.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  try {
    if (!query.slug) {
      throw new Error('No food slug provided');
    }

    const [foodRes, bookingRes, messages] = await Promise.all([
      api.get(`/food/${query.slug}`).catch(() => null),
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const food = foodRes?.data?.results;
    const bookingConfig = bookingRes?.data?.results?.value;

    return { food, bookingConfig, messages };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
    };
  }
};

export default EditFood;
