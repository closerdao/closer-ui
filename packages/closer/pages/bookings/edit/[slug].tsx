import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../../models';
import { BookingConfig, Event } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

interface Props {
  event: Event;
  bookingConfig: BookingConfig;
}

const EditEvent = ({ event, bookingConfig }: Props) => {
  const t = useTranslations();
  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const router = useRouter();
  const onUpdate = async (name: any, option: any, actionType: any) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/event/${event?._id}/add`, option);
    }
  };
  if (!event) {
    return <Heading>{t('bookings_edit_slug_not_found')}</Heading>;
  }

  if (!isBookingEnabled) {
    return <FeatureNotEnabled feature="booking" />;
  }

  return (
    <>
      <Head>
        <title>{`${t('bookings_edit_slug_title')} - ${event?.name}`}</title>
      </Head>
      <EditModelPageLayout
        title={`${t('bookings_edit_slug_title')} ${event?.name}`}
        backHref={event?.slug ? `/events/${event.slug}` : '/bookings'}
        isEdit
      >
        <EditModel
          id={event?._id}
          endpoint={'/event'}
          fields={models.event}
          onSave={(event) => router.push(`/events/${event?.slug}`)}
          onUpdate={(name, option, actionType) =>
            onUpdate(name, option, actionType)
          }
          allowDelete
          deleteButton="Delete Event"
          onDelete={() => router.push('/')}
        />
      </EditModelPageLayout>
    </>
  );
};

EditEvent.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  try {
    if (!query.slug) {
      throw new Error('No event');
    }

    const [eventRes, bookingRes, messages] = await Promise.all([
      api.get(`/event/${query.slug}`),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const event = eventRes?.data.results;
    const bookingConfig = bookingRes?.data.results.value;

    return { event, bookingConfig, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
      event: null,
      messages: null,
    };
  }
};

export default EditEvent;
