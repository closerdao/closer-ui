import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { FaArrowLeft } from '@react-icons/all-files/fa/FaArrowLeft';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import { Event } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';

interface Props {
  event: Event;
  error?: string;
}

const EditEvent = ({ event, error }: Props) => {
  const t = useTranslations();
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
        {!process.env.NEXT_PUBLIC_STRIPE_PUB_KEY && (
          <div className="my-4 error-box italic">
            {t('events_no_stripe_integration')}
          </div>
        )}
        <EditModel
          id={event._id}
          endpoint="/event"
          fields={models.event}
          initialData={event}
          onSave={(event) => router.push(`/events/${event.slug}`)}
          onUpdate={onUpdate}
          allowDelete
          deleteButton="Delete Event"
          onDelete={() => router.push('/')}
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

    const [eventRes, messages] = await Promise.all([
      api
        .get(`/event/${query.slug}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        })
        .catch((err) => {
          console.error('Error fetching event:', err);
          return null;
        }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const event = eventRes?.data?.results;

    return { event, messages };
  } catch (err) {
    console.log(err);
    return {
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default EditEvent;