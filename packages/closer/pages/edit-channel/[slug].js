import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../components/EditModel';

import models from '../../models';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const EditChannel = ({ channel }) => {
  const router = useRouter();
  const onUpdate = async (name, value, option, actionType) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/channel/${channel._id}/add`, option);
    }
  };
  if (!channel) {
    return 'Channel not found';
  }

  return (
    <>
      <Head>
        <title>{`${__('edit_channel_title')} - ${channel.name}`}</title>
        
      </Head>
      <div className="main-content w-full">
        <EditModel
          id={channel._id}
          endpoint={'/channel'}
          fields={models.channel}
          buttonText="Save"
          onSave={(channel) => router.push(`/channel/${channel.slug}`)}
          onUpdate={(name, value, option, actionType) =>
            onUpdate(name, value, option, actionType)
          }
          allowDelete
          deleteButton="Delete Channel"
          onDelete={() => (window.location.href = '/community')}
        />
      </div>
    </>
  );
};

EditChannel.getInitialProps = async ({ query }) => {
  try {
    if (!query.slug) {
      throw new Error('No channel');
    }
    const {
      data: { results: channel },
    } = await api.get(`/channel/${query.slug}`);

    return { channel };
  } catch (err) {
    return {
      error: err.message,
    };
  }
};

export default EditChannel;
