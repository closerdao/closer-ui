import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';
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

const CreateEvent = ({ foodOptions, eventsConfig }: Props) => {
  const t = useTranslations();
  const router = useRouter();

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
      <div className="main-content intro">
        <Heading level={2} className="mb-2">
          {t('events_create_title')}
        </Heading>
        <EditModel
          dynamicField={{
            name: 'foodOptionId',
            options: foodOptionsWithDefault,
          }}
          endpoint={'/event'}
          fields={models.event}
          onSave={(event) => router.push(`/events/${event.slug}`)}
        />
      </div>
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

    const foodOptions = foodRes?.data?.results;
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
