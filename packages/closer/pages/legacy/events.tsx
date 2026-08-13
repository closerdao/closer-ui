import Head from 'next/head';

import EventsCalendar from '../../components/EventsCalendar';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../configCached';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import { PageMetaOverride } from '../../types/page';
import { resolveBlockText } from '../../utils/blockI18n';
import { parseMessageFromError } from '../../utils/common';
import { getSiteUrl } from '../../utils/siteUrl';
import {
  fetchPageMetaOverride,
  resolvePageMeta,
} from '../../utils/standardPages';

const SITE_URL = getSiteUrl();

interface EventsConfig {
  enabled: boolean;
}

interface Props {
  generalConfig: GeneralConfig | null;
  eventsConfig: EventsConfig | null;
  pageMeta?: PageMetaOverride | null;
}

const Events = ({ generalConfig, eventsConfig, pageMeta }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const isEventsEnabled = eventsConfig?.enabled !== false;

  const meta = resolvePageMeta(pageMeta, {
    title: `${t('events_title')} - ${PLATFORM_NAME}`,
    description: `Discover upcoming events, workshops, and gatherings at ${PLATFORM_NAME}. Join our community for regenerative living experiences.`,
  });
  const title = resolveBlockText(meta.title, t);
  const description = resolveBlockText(meta.description, t);

  if (!isEventsEnabled) {
    return <FeatureNotEnabled feature="events" />;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content={`${PLATFORM_NAME}, events, workshops, gatherings, regenerative communities, community events, ecovillage events`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {SITE_URL && <meta property="og:url" content={`${SITE_URL}/events`} />}
        {meta.ogImage ? (
          <meta property="og:image" content={meta.ogImage} />
        ) : null}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {meta.ogImage ? (
          <meta name="twitter:image" content={meta.ogImage} />
        ) : null}
        {SITE_URL && (
          <link rel="canonical" href={`${SITE_URL}/events`} key="canonical" />
        )}
      </Head>

      <div className="main-content w-full mb-12">
        <EventsCalendar />
      </div>
    </>
  );
};

Events.getInitialProps = async (_context: NextPageContext) => {
  try {
    const generalConfig = config.general;
    const eventsConfig = config.events;
    const pageMeta = await fetchPageMetaOverride('/events');

    return {
      generalConfig,
      eventsConfig,
      pageMeta,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      eventsConfig: null,
      pageMeta: null,
      error: parseMessageFromError(err),
    };
  }
};

export default Events;
