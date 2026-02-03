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

interface Props {
  communityConfig: CommunityConfig | null;
}

const Community = ({ communityConfig }: Props) => {
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
      <MemberHome />
    </>
  );
};

Community.getInitialProps = async (context: NextPageContext) => {
  try {
    const [communityRes, messages] = await Promise.all([
      api.get('/config/community').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const communityConfig = communityRes?.data?.results?.value;

    return {
      communityConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      communityConfig: null,
      messages: null,
    };
  }
};

export default Community;
