import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../../components/EditModel';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import Heading from '../../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import models from '../../../models';
import { BookingConfig, Event } from '../../../types';
import { parseMessageFromError } from '../../../utils/common';
import { eventEditModelBackend, fetchEvent } from '../../../utils/events';

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
          {...eventEditModelBackend()}
          id={event?._id}
          endpoint={'/event'}
          fields={models.event}
          onSave={(event) => router.push(`/events/${event?.slug}`)}
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

    const event = await fetchEvent(String(query.slug));
    const bookingConfig = config.booking;

    return { event, bookingConfig };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: config.booking,
      event: null,
    };
  }
};

export default EditEvent;
