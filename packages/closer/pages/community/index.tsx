import Head from 'next/head';

import MemberHome from '../../components/MemberHome';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { loadLocaleData } from '../../utils/locale.helpers';

const Community = () => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('community_title')}</title>
      </Head>
      <MemberHome />
    </>
  );
};

Community.getInitialProps = async (context: NextPageContext) => {
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

export default Community;
