import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../components/EditModel';

import models from '../../models';
import { __ } from '../../utils/helpers';

const AddChannel = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{__('channel_create_title')}</title>
      </Head>
      <div className="main-content w-full">
        <EditModel
          endpoint={'/channel'}
          fields={models.channel}
          buttonText="Create Channel"
          onSave={(channel) => router.push(`/channel/${channel.slug}`)}
        />
      </div>
    </>
  );
};

export default AddChannel;
