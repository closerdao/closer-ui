import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { FaArrowLeft } from '@react-icons/all-files/fa/FaArrowLeft';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import { Event, GeneralConfig } from '../../../types';
import { FoodOption } from '../../../types/food';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

dayjs.extend(utc);
dayjs.extend(timezone);

// Convert timezone-aware datetime to UTC for database storage
const convertToUTC = (
  dateTime: string | Date | null,
  timeZone: string,
): string | null => {
  if (!dateTime || !timeZone) return null;

  // Parse the datetime in the specified timezone and convert to UTC
  const zonedDateTime = dayjs.tz(dateTime, timeZone);
  return zonedDateTime.utc().toISOString();
};

// Convert UTC datetime to timezone-aware datetime for display
const convertFromUTC = (
  utcDateTime: string | Date | null,
  timeZone: string,
): string | null => {
  if (!utcDateTime || !timeZone) return null;

  // Parse UTC datetime and convert to the specified timezone
  const utcDate = dayjs.utc(utcDateTime);
  return utcDate.tz(timeZone).format('YYYY-MM-DDTHH:mm:ss');
};

interface EventsConfig {
  enabled: boolean;
}

interface Props {
  event: Event;
  foodOptions: FoodOption[];
  error?: string;
  generalConfig: GeneralConfig;
  eventsConfig: EventsConfig | null;
}

const EditEvent = ({ event, error, foodOptions, generalConfig, eventsConfig }: Props) => {
  const t = useTranslations();

  const isEventsEnabled = eventsConfig?.enabled !== false;

  console.log('generalConfig=', generalConfig);

  const timeZone = generalConfig?.timeZone;

  // Pass the original UTC dates to DateTimePicker - it will handle timezone conversion
  const eventWithLocalTimes = event;

  console.log('EditEvent: event.start=', event.start, 'timeZone=', timeZone);

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

  // Transform data before saving: convert timezone times to UTC
  const transformDataBeforeSave = (data: any) => {
    if (!timeZone) return data;

    // The DateTimePicker now creates timezone-aware dates, so we need to convert them to UTC
    return {
      ...data,
      start: data.start ? dayjs(data.start).utc().toISOString() : data.start,
      end: data.end ? dayjs(data.end).utc().toISOString() : data.end,
    };
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
      <div className="main-content">
        {error && <div className="error-box">{error}</div>}
        <Link
          href={`/events/${event.slug}`}
          className="mr-2 italic flex flex-row items-center justify-start"
        >
          <FaArrowLeft className="mr-1" /> {t('generic_back')}
        </Link>
        <Heading level={2} className="flex justify-start items-center">
          {t('events_slug_edit_link')} <i>{event.name}</i>
        </Heading>
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
          allowDelete
          deleteButton="Delete Event"
          onDelete={() => router.push('/')}
          transformDataBeforeSave={transformDataBeforeSave}
          timeZone={timeZone}
        />
      </div>
    </>
  );
};

EditEvent.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    if (!query.slug) {
      throw new Error('No event');
    }

    const [generalConfigRes, eventRes, foodRes, eventsRes, messages] = await Promise.all([
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
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalConfigRes?.data?.results?.value;
    const event = eventRes?.data?.results;
    const foodOptions = foodRes?.data?.results;
    const eventsConfig = eventsRes?.data?.results?.value;

    return { event, foodOptions, messages, generalConfig, eventsConfig };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      generalConfig: null,
      messages: null,
      foodOptions: null,
      eventsConfig: null,
    };
  }
};

export default EditEvent;
