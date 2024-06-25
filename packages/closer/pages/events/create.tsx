import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import { loadLocaleData } from '../../utils/locale.helpers';

const CreateEvent = () => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{t('events_create_title')}</title>
      </Head>
      <div className="main-content intro">
        <Heading level={2} className="mb-2">
          {t('events_create_title')}
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

CreateEvent.getInitialProps = async (context: NextPageContext) => {
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

export default CreateEvent;
