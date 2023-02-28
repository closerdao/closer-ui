import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../../components/EditModel';
import Layout from '../../../components/Layout';

import models from '../../../models';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const EditEvent = ({ event }) => {
  const router = useRouter();
  const onUpdate = async (name, value, option, actionType) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/event/${event._id}/add`, option);
    }
  };
  if (!event) {
    return <h1>{__('bookings_edit_slug_not_found')}</h1>;
  }

  return (
    <Layout protect>
      <Head>
        <title>
          {__('bookings_edit_slug_title')} {event.name}
        </title>
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
    </Layout>
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
