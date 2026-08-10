import Head from 'next/head';

import MemberList from '../../components/MemberList';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

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
    return {
    };
  } catch (err: unknown) {
    return {
      };
  }
};

export default MembersPage;
