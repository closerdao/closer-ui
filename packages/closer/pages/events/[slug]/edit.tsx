import Head from 'next/head';
import { useRouter } from 'next/router';

import { useState } from 'react';

import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import { Event, GeneralConfig } from '../../../types';
import { FoodOption } from '../../../types/food';
import api from '../../../utils/api';
import { getBookingTokenCurrency } from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventsConfig {
  enabled: boolean;
}

interface PaymentConfig {
  utilityFiatCur?: string;
}

interface Web3Config {
  bookingToken?: string;
}

interface Props {
  event: Event;
  foodOptions: FoodOption[];
  error?: string;
  generalConfig: GeneralConfig;
  eventsConfig: EventsConfig | null;
  paymentConfig: PaymentConfig | null;
  web3Config: Web3Config | null;
}

const EditEvent = ({ event, error, foodOptions, generalConfig, eventsConfig, paymentConfig, web3Config }: Props) => {
  const t = useTranslations();
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEventsEnabled = eventsConfig?.enabled !== false;
  const timeZone = generalConfig?.timeZone;

  const initialFoodOptionIdForForm =
    event.foodOption === 'no_food'
      ? 'no_food'
      : event.foodOption === 'food_package' && event.foodOptionId
        ? event.foodOptionId
        : '';

  const eventWithLocalTimes = {
    ...event,
    foodOptionId: initialFoodOptionIdForForm,
  };

  const foodOptionsWithDefault = [
    {
      label: 'No food',
      value: 'no_food',
    },
    {
      label: 'Allow guests to select',
      value: '',
    },
    ...(foodOptions ?? [])?.map((option) => ({
      label: option.name,
      value: option._id,
    })),
  ];

  const router = useRouter();
  const onUpdate = async (
    name: any,
    value: any,
    option: any,
    actionType: any,
  ) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/event/${event._id}/add`, option);
    }
  };

  // Custom onSave handler to convert timezone times to UTC before saving
  const handleSave = (savedEvent: any) => {
    router.push(`/events/${savedEvent.slug}`);
  };

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
    return { ...data, foodOption, foodOptionId };
  };

  const paymentCurrency = paymentConfig?.utilityFiatCur ?? 'EUR';

  const transformDataBeforeSave = (data: any) => {
    let result = { ...data };
    if (timeZone) {
      result = {
        ...result,
        start: data.start ? dayjs(data.start).utc().toISOString() : data.start,
        end: data.end ? dayjs(data.end).utc().toISOString() : data.end,
      };
    }
    if (result.ticketOptions?.length && paymentCurrency) {
      result = {
        ...result,
        ticketOptions: result.ticketOptions.map((opt: any) => ({
          ...opt,
          currency: paymentCurrency,
        })),
      };
    }
    return transformEventFoodBeforeSave(result);
  };
  if (!isEventsEnabled) {
    return <FeatureNotEnabled feature="events" />;
  }

  if (!event) {
    return <Heading>{t('events_slug_edit_error')}</Heading>;
  }

  return (
    <>
      <Head>
        <title>{`${t('events_slug_edit_title')} ${event.name}`}</title>
      </Head>
      <EditModelPageLayout
        title={`${t('events_slug_edit_link')} ${event.name}`}
        backHref={`/events/${event.slug}`}
        isEdit
      >
        {error && <div className="error-box mb-4">{error}</div>}
        {saveError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/50 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
          >
            {saveError}
          </div>
        )}
        {!process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY && (
          <div className="my-4 error-box italic">
            {t('events_no_stripe_integration')}
          </div>
        )}
        <EditModel
          endpoint={'/event'}
          dynamicField={{
            name: 'foodOptionId',
            options: foodOptionsWithDefault,
          }}
          id={event._id}
          fields={models.event}
          initialData={eventWithLocalTimes}
          onSave={handleSave}
          onUpdate={onUpdate}
          onError={setSaveError}
          onErrorClear={() => setSaveError(null)}
          allowDelete
          deleteButton="Delete Event"
          onDelete={() => router.push('/')}
          transformDataBeforeSave={transformDataBeforeSave}
          timeZone={timeZone}
          currencyConfig={{
            fiatCur: paymentCurrency,
            tokenCur: getBookingTokenCurrency(web3Config, undefined),
          }}
        />
      </EditModelPageLayout>
    </>
  );
};

EditEvent.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    if (!query.slug) {
      throw new Error('No event');
    }

    const [generalConfigRes, eventRes, foodRes, eventsRes, paymentRes, web3Res, messages] = await Promise.all([
      api.get('/config/general').catch((err) => {
        console.error('Error fetching general config:', err);
        return null;
      }),
      api.get(`/event/${query.slug}`, {
        headers: (req as NextApiRequest)?.cookies?.access_token && {
          Authorization: `Bearer ${
            (req as NextApiRequest)?.cookies?.access_token
          }`,
        },
      }),
      api.get('/food').catch((err) => {
        console.error('Error fetching food:', err);
        return null;
      }),
      api.get('/config/events').catch(() => null),
      api.get('/config/payment').catch(() => null),
      api.get('/config/web3').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalConfigRes?.data?.results?.value;
    const event = eventRes?.data?.results;
    const allFood = foodRes?.data?.results || [];
    const foodOptions = allFood.filter((f: FoodOption) =>
      f.availableFor?.includes('events'),
    );
    const eventsConfig = eventsRes?.data?.results?.value;
    const paymentConfig = paymentRes?.data?.results?.value ?? null;
    const web3Config = web3Res?.data?.results?.value ?? null;

    return { event, foodOptions, messages, generalConfig, eventsConfig, paymentConfig, web3Config };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      generalConfig: null,
      messages: null,
      foodOptions: null,
      eventsConfig: null,
      paymentConfig: null,
      web3Config: null,
    };
  }
};

export default EditEvent;
