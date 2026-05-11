import Head from 'next/head';
import { useRouter } from 'next/router';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import EditModel, { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import config from '../../configCached';

interface Props {
  bookingConfig: any;
}

const CreateFood = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  return (
    <>
      <Head>
        <title>{t('food_create_title')}</title>
      </Head>
      <AdminLayout>
        <EditModelPageLayout
          title={t('food_create_title')}
          subtitle={t('edit_model_create_intro')}
        >
          <EditModel
            endpoint={'/food'}
            fields={models.food}
            onSave={() => router.push('/food')}
          />
        </EditModelPageLayout>
      </AdminLayout>
    </>
  );
};

CreateFood.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingConfig = config.booking;
    return {
      bookingConfig,
    };
  } catch (err: unknown) {
    return {
      bookingConfig: null,
      };
  }
};

export default CreateFood;
