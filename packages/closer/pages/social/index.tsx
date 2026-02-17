import Head from 'next/head';

import { useState } from 'react';

import { Bell, X } from 'lucide-react';

import MemberHome from '../../components/MemberHome';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { usePushNotifications } from '../../contexts/push-notifications';
import { getConfig, getConfigValueBySlug } from '../../utils/configCache';
import api from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';

interface CommunityConfig {
  enabled: boolean;
}

interface BookingConfig {
  enabled?: boolean;
}

interface Props {
  communityConfig: CommunityConfig | null;
  bookingConfig: BookingConfig | null;
  initialChannelSlug: string | null;
}

const Social = ({
  communityConfig,
  bookingConfig,
  initialChannelSlug,
}: Props) => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe } =
    usePushNotifications();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const isCommunityEnabled = communityConfig?.enabled === true;

  if (!isCommunityEnabled) {
    return <FeatureNotEnabled feature="community" />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  const showBanner =
    isSupported &&
    !isSubscribed &&
    permission !== 'denied' &&
    !isBannerDismissed;

  return (
    <>
      <Head>
        <title>{t('community_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {showBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50/80 border border-blue-200/70 px-4 py-2.5 mb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm text-blue-800">
              {t('push_notification_community_banner')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={subscribe}
              className="text-xs sm:text-sm font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2"
            >
              {t('push_notification_community_enable')}
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="text-blue-400 hover:text-blue-600 rounded-md p-1 hover:bg-blue-100/70"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <MemberHome
        initialChannelSlug={initialChannelSlug}
        bookingConfig={bookingConfig}
      />
    </>
  );
};

Social.getInitialProps = async (context: NextPageContext) => {
  try {
    const { query, asPath, res } = context;
    const legacyChannelQueryPath =
      typeof asPath === 'string' &&
      asPath.startsWith('/social?') &&
      /(?:\?|&)channel=/.test(asPath);
    const channelSlug =
      typeof query?.channel === 'string' ? query.channel : null;
    const tabParam = typeof query?.tab === 'string' ? query.tab : null;

    if (legacyChannelQueryPath && channelSlug) {
      const encodedSlug = encodeURIComponent(channelSlug);
      const destination = tabParam
        ? `/social/${encodedSlug}?tab=${tabParam}`
        : `/social/${encodedSlug}`;

      if (res) {
        res.writeHead(302, { Location: destination });
        res.end();
      } else if (typeof window !== 'undefined') {
        window.location.href = destination;
      }
    }

    const [configs, messages] = await Promise.all([
      getConfig(api),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const communityConfig = getConfigValueBySlug(configs, 'community');
    const bookingConfig = getConfigValueBySlug(configs, 'booking') ?? null;
    const initialChannelSlug = channelSlug;

    return {
      communityConfig,
      bookingConfig,
      initialChannelSlug,
      messages,
    };
  } catch (err: unknown) {
    return {
      communityConfig: null,
      bookingConfig: null,
      initialChannelSlug: null,
      messages: null,
    };
  }
};

export default Social;
