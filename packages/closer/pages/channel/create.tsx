import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../components/EditModel';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import { loadLocaleData } from '../../utils/locale.helpers';

const AddChannel = () => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{t('channel_create_title')}</title>
      </Head>
      <div className="main-content w-full">
        <EditModel
          endpoint={'/channel'}
          fields={models.channel}
          onSave={(channel) => router.push(`/channel/${channel.slug}`)}
        />
      </div>
    </>
  );
};

AddChannel.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default AddChannel;
