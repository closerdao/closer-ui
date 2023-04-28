import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { FC } from 'react';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import models from '../../models';
import { __ } from '../../utils/helpers';

const CreateEvent: FC = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{__('events_create_title')}</title>
      </Head>
      <div className="main-content intro">
        <Heading level={2} className="mb-2">
          {__('events_create_title')}
        </Heading>
        <EditModel
          endpoint={'/event'}
          fields={models.event}
          onSave={(event) => router.push(`/events/${event.slug}`)}
        />
      </div>
    </>
  );
};

export default CreateEvent;
