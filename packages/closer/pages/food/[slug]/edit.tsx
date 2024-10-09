import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import AdminLayout from '../../../components/Dashboard/AdminLayout';

interface Props {
  food: any;
}

const EditFood = ({ food }: Props) => {
  const t = useTranslations();
  const router = useRouter();
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
      <AdminLayout>
        <div className=" flex">
          <section className="max-w-4xl w-full">
            <Heading level={2} className="mb-2">
              Edit option <i>{food.name}</i>
            </Heading>
            <EditModel
              id={food._id}
              endpoint={'/food'}
              fields={models.food}
              onSave={() => router.push('/food')}
              onUpdate={(name, value, option, actionType) =>
                onUpdate(name, value, option, actionType)
              }
              allowDelete
              deleteButton="Delete food option"
              onDelete={() => router.push('/food')}
            />
          </section>
        </div>
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

    const [foodRes, messages] = await Promise.all([
      api.get(`/food/${query.slug}`).catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const food = foodRes?.data?.results;

    return { food, messages };
  } catch (err: unknown) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default EditFood;
