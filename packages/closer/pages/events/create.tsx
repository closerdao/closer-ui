import Head from 'next/head';
import { useRouter } from 'next/router';

import { useState } from 'react';

import EditModel, { EditModelPageLayout } from '../../components/EditModel';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import { loadLocaleData } from '../../utils/locale.helpers';
import { FoodOption } from '../../types/food';
import api from '../../utils/api';

interface EventsConfig {
  enabled: boolean;
}

interface Props {
  foodOptions: FoodOption[];
  eventsConfig: EventsConfig | null;
}

const transformEventFoodBeforeSave = (data: any) => {
  const raw = data.foodOptionId;
  const foodOption =
    raw === 'no_food'
      ? 'no_food'
      : raw && raw !== ''
        ? 'food_package'
        : 'default';
  const foodOptionId =
    foodOption === 'food_package' ? raw : null;
  return {
    ...data,
    foodOption,
    foodOptionId,
  };
};

const CreateEvent = ({ foodOptions, eventsConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEventsEnabled = eventsConfig?.enabled !== false;

  const foodOptionsWithDefault = [
    {
      label: 'Allow guests to select',
      value: '',
    },
    {
      label: 'No food',
      value: 'no_food',
    },
    ...foodOptions?.map((option) => ({
      label: option.name,
      value: option._id,
    })),
  ];

  if (!isEventsEnabled) {
    return <FeatureNotEnabled feature="events" />;
  }

  return (
    <>
      <Head>
        <title>{t('events_create_title')}</title>
      </Head>
      <EditModelPageLayout
        title={t('events_create_title')}
        subtitle={t('edit_model_create_intro')}
      >
        {saveError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/50 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
          >
            {saveError}
          </div>
        )}
        <EditModel
          dynamicField={{
            name: 'foodOptionId',
            options: foodOptionsWithDefault,
          }}
          endpoint={'/event'}
          fields={models.event}
          onSave={(event) => router.push(`/events/${event.slug}`)}
          onError={setSaveError}
          onErrorClear={() => setSaveError(null)}
          transformDataBeforeSave={transformEventFoodBeforeSave}
        />
      </EditModelPageLayout>
    </>
  );
};

CreateEvent.getInitialProps = async (context: NextPageContext) => {
  try {
    const [foodRes, eventsRes, messages] = await Promise.all([
      api.get('/food').catch((err) => {
        console.error('Error fetching food:', err);
        return null;
      }),
      api.get('/config/events').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const allFood = foodRes?.data?.results || [];
    const foodOptions = allFood.filter((f: FoodOption) =>
      f.availableFor?.includes('events'),
    );
    const eventsConfig = eventsRes?.data?.results?.value;

    return {
      messages,
      foodOptions,
      eventsConfig,
    };
  } catch (err: unknown) {
    return {
      messages: null,
      foodOptions: null,
      eventsConfig: null,
    };
  }
};

export default CreateEvent;
