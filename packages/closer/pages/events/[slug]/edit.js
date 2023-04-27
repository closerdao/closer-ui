import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../../components/EditModel';

import { FaArrowLeft } from '@react-icons/all-files/fa/FaArrowLeft';

import models from '../../../models';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const EditEvent = ({ event, error }) => {
  const router = useRouter();
  const onUpdate = async (name, value, option, actionType) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/event/${event._id}/add`, option);
    }
  };
  if (!event) {
    return <h1>{__('events_slug_edit_error')}</h1>;
  }

  return (
    <>
      <Head>
        <title>{`${__('events_slug_edit_title')} ${event.name}`}</title>
      </Head>
      <div className="main-content">
        { error && <div className="error-box">{ error }</div> }
        <Link
          href={`/events/${event.slug}`}
          className="mr-2 italic flex flex-row items-center justify-start"
        >
          <FaArrowLeft className="mr-1" /> {__('generic_back')}
        </Link>
        <h2 className="flex justify-start items-center">
          {__('events_slug_edit_link')} <i>{event.name}</i>
        </h2>
        {!process.env.NEXT_PUBLIC_STRIPE_PUB_KEY && (
          <div className="my-4 error-box italic">
            {__('events_no_stripe_integration')}
          </div>
        )}
        <EditModel
          id={event._id}
          endpoint="/event"
          fields={models.event}
          initialData={ event }
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

EditEvent.getInitialProps = async ({ req, query }) => {
  try {
    if (!query.slug) {
      throw new Error('No event');
    }
    const {
      data: { results: event },
    } = await api.get(`/event/${query.slug}`, {
      headers: req?.cookies?.access_token && {
        Authorization: `Bearer ${req?.cookies?.access_token}`
      }
    });

    return { event };
  } catch (err) {
    console.log(err);
    return {
      error: err.message,
    };
  }
};

export default EditEvent;
