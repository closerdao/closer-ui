import Head from 'next/head';
import Link from 'next/link';

import EventsList from '../../components/EventsList';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

const now = new Date();

interface Props {
  generalConfig: GeneralConfig | null;
}

const Events = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const { PERMISSIONS } = useConfig() || {};
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>{`${t('events_title')} - ${PLATFORM_NAME}`}</title>
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/events"
          key="canonical"
        />
      </Head>
      <div className="main-content w-full mb-12">
        <div className="flex justify-between">
          <Heading level={2} className="mb-4 text-xl">
            {t('events_upcoming')}
          </Heading>
          <div className="action">
            {user &&
              (!PERMISSIONS ||
                !PERMISSIONS.event.create ||
                user.roles.includes(PERMISSIONS.event.create)) && (
                <Link href="/events/create" className="btn-primary">
                  {t('events_link')}
                </Link>
              )}
          </div>
        </div>
        <EventsList
          cols={2}
          limit={30}
          where={{
            end: {
              $gt: now,
            },
          }}
          sort_by="start"
        />
      </div>
      <div className="main-content intro">
        <div className="page-title flex justify-between">
          <Heading level={2} className="mb-4 text-xl">
            {t('events_past')}
          </Heading>
        </div>
        <EventsList
          cols={2}
          limit={30}
          where={{
            end: {
              $lt: now,
            },
          }}
        />
      </div>
    </>
  );
};

Events.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default Events;
