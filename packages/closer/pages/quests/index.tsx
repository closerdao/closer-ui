import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useState } from 'react';

import FeatureNotEnabled from '../../components/FeatureNotEnabled';
import { QuestAdminStats, QuestCard } from '../../components/Quests';
import Heading from '../../components/ui/Heading';

import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../configCached';
import { useConfig } from '../../hooks/useConfig';
import { useRBAC } from '../../hooks/useRBAC';
import type { GeneralConfig } from '../../types';
import type { Quest } from '../../types/quest';
import { parseMessageFromError } from '../../utils/common';
import { getQuests } from '../../utils/quests.api';
import { getQuestListSection } from '../../utils/quests.helpers';

interface QuestsConfig {
  enabled: boolean;
}

interface Props {
  quests: Quest[];
  generalConfig: GeneralConfig | null;
  questsConfig: QuestsConfig | null;
  error?: string | null;
}

const QuestsPage = ({ quests, generalConfig, questsConfig, error }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const { hasAccess } = useRBAC();
  const router = useRouter();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig?.platformName;

  const isQuestsEnabled = questsConfig?.enabled !== false;
  const isQuestAdmin = hasAccess('QuestCreation');

  /**
   * Scheduled and draft quests are admin-only, so they are never in the
   * server-rendered payload — an admin picks them up client-side instead.
   */
  const [adminQuests, setAdminQuests] = useState<Quest[]>([]);

  const loadAdminQuests = useCallback(async () => {
    if (!isQuestAdmin) {
      setAdminQuests([]);
      return;
    }
    try {
      const results = await getQuests({ status: ['scheduled', 'draft'] });
      setAdminQuests(results);
    } catch {
      // The public list still renders; drafts simply stay hidden.
    }
  }, [isQuestAdmin]);

  useEffect(() => {
    loadAdminQuests();
  }, [loadAdminQuests]);

  const allQuests = useMemo(() => {
    const byId = new Map<string, Quest>();
    [...adminQuests, ...(quests || [])].forEach((quest) =>
      byId.set(quest._id, quest),
    );
    return [...byId.values()];
  }, [quests, adminQuests]);

  const { live, upcoming, drafts, past } = useMemo(() => {
    const groups: {
      live: Quest[];
      upcoming: Quest[];
      drafts: Quest[];
      past: Quest[];
    } = { live: [], upcoming: [], drafts: [], past: [] };

    allQuests.forEach((quest) => {
      const section = getQuestListSection(quest);
      if (section) groups[section].push(quest);
    });

    // Open and upcoming quests read best by what closes/opens first.
    groups.live.sort((a, b) => dayjs(a.end).valueOf() - dayjs(b.end).valueOf());
    groups.upcoming.sort(
      (a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf(),
    );
    groups.drafts.sort(
      (a, b) =>
        dayjs(b.updated || b.created).valueOf() -
        dayjs(a.updated || a.created).valueOf(),
    );
    groups.past.sort((a, b) => dayjs(b.end).valueOf() - dayjs(a.end).valueOf());
    return groups;
  }, [allQuests]);

  if (!isQuestsEnabled) {
    return <FeatureNotEnabled feature="quests" />;
  }

  const visibleCount =
    live.length +
    past.length +
    (isQuestAdmin ? upcoming.length + drafts.length : 0);

  const renderSection = (title: string, items: Quest[], hint?: string) =>
    items.length ? (
      <section className="mb-10">
        <Heading level={3} className="mb-1">
          {title}
        </Heading>
        {hint && <p className="text-sm text-gray-500 mb-4">{hint}</p>}
        <div className={`flex flex-col gap-3 ${hint ? '' : 'mt-4'}`}>
          {items.map((quest) => (
            <QuestCard
              key={quest._id}
              quest={quest}
              isAdmin={isQuestAdmin}
              onPublished={(published) => {
                if (published) {
                  setAdminQuests((current) =>
                    current.map((item) =>
                      item._id === published._id ? published : item,
                    ),
                  );
                }
                router.replace(router.asPath);
              }}
            />
          ))}
        </div>
      </section>
    ) : null;

  return (
    <>
      <Head>
        <title>{`${t('quests_title')} - ${PLATFORM_NAME}`}</title>
        <meta name="description" content={t('quests_meta_description')} />
        <meta
          property="og:title"
          content={`${t('quests_title')} - ${PLATFORM_NAME}`}
        />
        <meta
          property="og:description"
          content={t('quests_meta_description')}
        />
        <meta property="og:type" content="website" />
      </Head>

      <div className="main-content w-full mb-12">
        <div className="flex flex-wrap items-start gap-4 mb-8">
          <div>
            <Heading level={1} className="mb-2">
              {t('quests_title')}
            </Heading>
            <p className="text-gray-500 max-w-2xl">{t('quests_intro')}</p>
          </div>
          {isQuestAdmin && (
            <Link
              href="/quests/create"
              className="btn-primary ml-auto inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t('quests_add')}
            </Link>
          )}
        </div>

        {isQuestAdmin && <QuestAdminStats quests={allQuests} />}

        {error && <p className="text-error mb-6">{error}</p>}

        {visibleCount ? (
          <>
            {renderSection(t('quests_section_live'), live)}
            {isQuestAdmin &&
              renderSection(
                t('quests_section_upcoming'),
                upcoming,
                t('quests_section_upcoming_hint'),
              )}
            {isQuestAdmin &&
              renderSection(
                t('quests_section_drafts'),
                drafts,
                t('quests_section_drafts_hint'),
              )}
            {renderSection(t('quests_section_past'), past)}
          </>
        ) : (
          !error && (
            <p className="italic text-gray-500 py-8">{t('quests_empty')}</p>
          )
        )}
      </div>
    </>
  );
};

QuestsPage.getInitialProps = async (context: NextPageContext) => {
  const { req } = context;
  try {
    // Guests only ever see what is running or finished.
    const quests = await getQuests({
      status: ['live', 'locked', 'settled'],
      req: req as NextApiRequest,
    });

    return {
      quests,
      generalConfig: config.general || null,
      questsConfig: config.quests || null,
      error: null,
    };
  } catch (err: unknown) {
    return {
      quests: [],
      generalConfig: config.general || null,
      questsConfig: config.quests || null,
      error: parseMessageFromError(err),
    };
  }
};

export default QuestsPage;
