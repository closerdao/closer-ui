import Head from 'next/head';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { CohousingTeamView } from '../../../components/cohousing/cohousingTeamView';
import { useAuth } from '../../../contexts/auth';
import PageNotAllowed from '../../401';
import { loadLocaleData } from '../../../utils/locale.helpers';

const CohousingApplicationsTeamPage = () => {
  const t = useTranslations();
  const { user } = useAuth();

  if (
    !user ||
    (!user.roles?.includes('community-curator') &&
      !user.roles?.includes('admin') &&
      !user.roles?.includes('team'))
  ) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('cohousing_team_page_title')}</title>
      </Head>
      <CohousingTeamView />
    </>
  );
};

export default CohousingApplicationsTeamPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      messages: await loadLocaleData(locale as string, 'tdf'),
    },
  };
}
