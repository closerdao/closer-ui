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
        <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm text-blue-800">
              {t('push_notification_community_banner')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={subscribe}
              className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
            >
              {t('push_notification_community_enable')}
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="text-blue-400 hover:text-blue-600"
            >
              <X className="w-4 h-4" />
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
    const { query } = context;
    const [communityRes, bookingRes, messages] = await Promise.all([
      api.get('/config/community').catch(() => null),
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const communityConfig = communityRes?.data?.results?.value;
    const bookingConfig = bookingRes?.data?.results?.value ?? null;
    const initialChannelSlug =
      typeof query?.channel === 'string' ? query.channel : null;

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
