import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../components/EditModel';
import Layout from '../../components/Layout';

import models from '../../models';
import { __ } from '../../utils/helpers';

const AddChannel = ({ token }) => {
  const router = useRouter();

  return (
    <Layout protect>
      <Head>
        <title>{__('events_create_title')}</title>
      </Head>
      <div className="main-content intro">
        <EditModel
          endpoint={'/event'}
          fields={models.event}
          buttonText="Create Event"
          onSave={(event) => router.push(`/events/${event.slug}`)}
        />
      </div>
    </Layout>
  );
};

export default AddChannel;
