import Head from 'next/head';
import Link from 'next/link';

import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import { QuestEditor } from '../../components/Quests';
import Heading from '../../components/ui/Heading';

import { ArrowLeft } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../configCached';
import { useRBAC } from '../../hooks/useRBAC';
import type { GeneralConfig } from '../../types';
import PageNotFound from '../not-found';

interface QuestsConfig {
  enabled: boolean;
}

interface Props {
  generalConfig: GeneralConfig | null;
  questsConfig: QuestsConfig | null;
  web3Config: { bookingToken?: string } | null;
  paymentConfig: { fiatCur?: string; utilityFiatCur?: string } | null;
}

const CreateQuestPage = ({
  generalConfig,
  questsConfig,
  web3Config,
  paymentConfig,
}: Props) => {
  const t = useTranslations();
  const { hasAccess } = useRBAC();

  if (questsConfig?.enabled === false) {
    return <FeatureNotEnabled feature="quests" />;
  }

  if (!hasAccess('QuestCreation')) {
    return <PageNotFound back="/quests" />;
  }

  return (
    <>
      <Head>
        <title>{t('quests_create_title')}</title>
      </Head>

      <div className="main-content w-full mb-12">
        <Link
          href="/quests"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('quests_back')}
        </Link>

        <Heading level={1} className="mb-2">
          {t('quests_create_title')}
        </Heading>
        <p className="text-gray-500 mb-6 max-w-2xl">
          {t('quests_create_intro')}
        </p>

        <QuestEditor
          defaultTimezone={generalConfig?.timeZone}
          bookingToken={web3Config?.bookingToken}
          fiatCurrency={paymentConfig?.fiatCur || paymentConfig?.utilityFiatCur}
        />
      </div>
    </>
  );
};

CreateQuestPage.getInitialProps = async (_context: NextPageContext) => ({
  generalConfig: config.general || null,
  questsConfig: config.quests || null,
  web3Config: config.web3 || null,
  paymentConfig: config.payment || null,
});

export default CreateQuestPage;
