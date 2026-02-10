import Head from 'next/head';

import MemberHome from '../../components/MemberHome';
import FeatureNotEnabled from '../../components/FeatureNotEnabled';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
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

const Community = ({
  communityConfig,
  bookingConfig,
  initialChannelSlug,
}: Props) => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();

  const isCommunityEnabled = communityConfig?.enabled === true;

  if (!isCommunityEnabled) {
    return <FeatureNotEnabled feature="community" />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('community_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <MemberHome
        initialChannelSlug={initialChannelSlug}
        bookingConfig={bookingConfig}
      />
    </>
  );
};

Community.getInitialProps = async (context: NextPageContext) => {
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

export default Community;
