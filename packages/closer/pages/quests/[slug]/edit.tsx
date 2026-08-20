import Head from 'next/head';
import Link from 'next/link';

import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import { QuestEditor } from '../../../components/Quests';
import Heading from '../../../components/ui/Heading';

import { ArrowLeft } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { useRBAC } from '../../../hooks/useRBAC';
import type { GeneralConfig } from '../../../types';
import type { Quest } from '../../../types/quest';
import { parseMessageFromError } from '../../../utils/common';
import { getQuest } from '../../../utils/quests.api';
import PageNotFound from '../../not-found';

interface QuestsConfig {
  enabled: boolean;
}

interface Props {
  quest: Quest | null;
  generalConfig: GeneralConfig | null;
  questsConfig: QuestsConfig | null;
  web3Config: { bookingToken?: string } | null;
  paymentConfig: { fiatCur?: string; utilityFiatCur?: string } | null;
  error?: string | null;
}

const EditQuestPage = ({
  quest,
  generalConfig,
  questsConfig,
  web3Config,
  paymentConfig,
  error,
}: Props) => {
  const t = useTranslations();
  const { hasAccess } = useRBAC();

  if (questsConfig?.enabled === false) {
    return <FeatureNotEnabled feature="quests" />;
  }

  if (!hasAccess('QuestCreation')) {
    return <PageNotFound back={`/quests/${quest?.slug || ''}`} />;
  }

  if (!quest) {
    return <PageNotFound error={error || undefined} />;
  }

  return (
    <>
      <Head>
        <title>{`${t('quests_edit_title')} — ${quest.title}`}</title>
      </Head>

      <div className="main-content w-full mb-12">
        <Link
          href={`/quests/${quest.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {quest.title}
        </Link>

        <Heading level={1} className="mb-6">
          {t('quests_edit_title')}
        </Heading>

        <QuestEditor
          quest={quest}
          defaultTimezone={generalConfig?.timeZone}
          bookingToken={web3Config?.bookingToken}
          fiatCurrency={paymentConfig?.fiatCur || paymentConfig?.utilityFiatCur}
        />
      </div>
    </>
  );
};

EditQuestPage.getInitialProps = async (context: NextPageContext) => {
  const { req, query } = context;
  try {
    const quest = await getQuest(String(query.slug), {
      req: req as NextApiRequest,
    });
    return {
      quest,
      generalConfig: config.general || null,
      questsConfig: config.quests || null,
      web3Config: config.web3 || null,
      paymentConfig: config.payment || null,
      error: null,
    };
  } catch (err: unknown) {
    return {
      quest: null,
      generalConfig: config.general || null,
      questsConfig: config.quests || null,
      web3Config: config.web3 || null,
      paymentConfig: config.payment || null,
      error: parseMessageFromError(err),
    };
  }
};

export default EditQuestPage;
