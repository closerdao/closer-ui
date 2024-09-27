import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import { loadLocaleData } from '../../utils/locale.helpers';
import { FoodOption } from '../../types/food';
import api from '../../utils/api';

interface Props {
  foodOptions: FoodOption[];
}

const CreateEvent = ({ foodOptions }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const foodOptionsWithDefault = [
    {
      label: 'Allow guests to select',
      value: '',
    },
    ...foodOptions?.map((option) => ({
      label: option.name,
      value: option._id,
    })),
  ];

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
    const [foodRes, messages] = await Promise.all([

      api.get('/food').catch((err) => {
        console.error('Error fetching food:', err);
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const foodOptions = foodRes?.data?.results;
    return {
      messages,
      foodOptions,
    };
  } catch (err: unknown) {
    return {
      messages: null,
      foodOptions: null,
    };
  }
};

export default CreateEvent;
