import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel, { EditModelPageLayout } from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import { channelEditModelBackend, fetchChannel } from '../../utils/channels';
import { parseMessageFromError } from '../../utils/common';

interface Props {
  channel: any;
}

const EditChannel = ({ channel }: Props) => {
  const t = useTranslations();
  const router = useRouter();
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
          {...channelEditModelBackend()}
          allowDelete
          deleteButton="Delete Channel"
          onDelete={() => (window.location.href = '/social')}
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

    const channel = await fetchChannel(String(query.slug)).catch(() => null);

    return { channel };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default EditChannel;
