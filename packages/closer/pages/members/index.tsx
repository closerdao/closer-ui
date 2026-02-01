import Head from 'next/head';

import MemberList from '../../components/MemberList';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { loadLocaleData } from '../../utils/locale.helpers';

const MembersPage = () => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{t('members_title')}</title>
        <meta name="description" content={t('members_meta_description')} />
        <meta property="og:title" content={t('members_title')} />
        <meta property="og:description" content={t('members_meta_description')} />
        <meta property="og:type" content="website" />
      </Head>
      <div className="main-content fullheight">
        <MemberList filter={{ roles: 'member' }} />
      </div>
    </>
  );
};

MembersPage.getInitialProps = async (context: NextPageContext) => {
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

export default MembersPage;
