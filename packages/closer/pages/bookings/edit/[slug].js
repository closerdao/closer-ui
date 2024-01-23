import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import PageNotFound from '../../404';
import { useConfig } from '../../../hooks/useConfig';
import models from '../../../models';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const EditEvent = ({ event }) => {
  const { enabledConfigs } = useConfig();
  const router = useRouter();
  const onUpdate = async (name, value, option, actionType) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/event/${event._id}/add`, option);
    }
  };
  if (!event) {
    return <Heading>{__('bookings_edit_slug_not_found')}</Heading>;
  }

  if (
    process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true' ||
    (enabledConfigs && !enabledConfigs.includes('booking'))
  ) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`${__('bookings_edit_slug_title')} - ${event.name}`}</title>
      </Head>
      <div className="main-content">
        <EditModel
          id={event._id}
          endpoint={'/event'}
          fields={models.event}
          buttonText="Save"
          onSave={(event) => router.push(`/events/${event.slug}`)}
          onUpdate={(name, value, option, actionType) =>
            onUpdate(name, value, option, actionType)
          }
          allowDelete
          deleteButton="Delete Event"
          onDelete={() => router.push('/')}
        />
      </div>
    </>
  );
};

EditEvent.getInitialProps = async ({ query }) => {
  try {
    if (!query.slug) {
      throw new Error('No event');
    }
    const {
      data: { results: event },
    } = await api.get(`/event/${query.slug}`);

    return { event };
  } catch (err) {
    return {
      error: err.message,
    };
  }
};

export default EditEvent;
