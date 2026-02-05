import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

interface Props {
  channel: any;
}

const EditChannel = ({ channel }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const onUpdate = async (name: any, option: any, actionType: any) => {
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
        <title>{`${t('edit_channel_title')} - ${channel.name}`}</title>
      </Head>
      <EditModelPageLayout
        title={`${t('edit_channel_title')} ${channel.name}`}
        backHref={`/channel/${channel.slug}`}
        isEdit
      >
        <EditModel
          id={channel._id}
          endpoint={'/channel'}
          fields={models.channel}
          onSave={(channel) => router.push(`/channel/${channel.slug}`)}
          onUpdate={(name, option, actionType) =>
            onUpdate(name, option, actionType)
          }
          allowDelete
          deleteButton="Delete Channel"
          onDelete={() => (window.location.href = '/community')}
        />
      </EditModelPageLayout>
    </>
  );
};

EditChannel.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;
  try {
    if (!query.slug) {
      throw new Error('No channel');
    }

    const [channelRes, messages] = await Promise.all([
      api.get(`/channel/${query.slug}`).catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const channel = channelRes?.data?.results;

    return { channel, messages };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default EditChannel;
