import Head from 'next/head';
import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';

import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import {
  QuestActionForm,
  QuestAdminPanel,
  QuestCountdown,
  QuestEntryPanel,
  QuestHowItWorks,
  QuestLeaderboard,
  QuestPrizes,
  QuestStatusBadge,
  QuestWinners,
} from '../../../components/Quests';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import { ArrowLeft, Link2, Pencil } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { useQuestLiveData } from '../../../hooks/useQuestLiveData';
import { useRBAC } from '../../../hooks/useRBAC';
import type { GeneralConfig } from '../../../types';
import type { Quest } from '../../../types/quest';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { getQuest, getQuestUsers } from '../../../utils/quests.api';
import {
  getLinkedEventIds,
  getQuestCountdownTarget,
  getQuestDateRange,
  isQuestOpen,
} from '../../../utils/quests.helpers';
import PageNotFound from '../../not-found';

interface QuestsConfig {
  enabled: boolean;
}

interface Props {
  quest: Quest | null;
  winnerUsers?: {
    _id: string;
    screenname?: string;
    slug?: string;
    photo?: string;
  }[];
  generalConfig: GeneralConfig | null;
  questsConfig: QuestsConfig | null;
  web3Config: { bookingToken?: string } | null;
  error?: string | null;
}

const QuestPage = ({
  quest: initialQuest,
  winnerUsers,
  generalConfig,
  questsConfig,
  web3Config,
  error,
}: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const { isAuthenticated } = useAuth();
  const { hasAccess } = useRBAC();
  const isQuestAdmin = hasAccess('QuestCreation');
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig?.platformName;

  const isQuestsEnabled = questsConfig?.enabled !== false;

  const [hasCopied, setHasCopied] = useState(false);

  /**
   * lock, draw and settle all rewrite the quest itself, so the page cannot keep
   * serving the copy it was rendered with.
   */
  const [quest, setQuest] = useState(initialQuest);
  useEffect(() => setQuest(initialQuest), [initialQuest]);

  const refreshQuest = useCallback(async () => {
    if (!initialQuest?.slug) return;
    const fresh = await getQuest(initialQuest.slug, { force: true }).catch(
      () => null,
    );
    if (fresh) setQuest(fresh);
  }, [initialQuest?.slug]);

  const slug = quest?.slug;
  const showLeaderboard =
    quest?.type !== 'raffle' || quest?.raffleConfig?.showLeaderboard !== false;

  /**
   * Tickets are aggregated backend-side rather than driven by anything the
   * member does on this page, so the standings are pulled rather than assumed.
   */
  const { me, leaderboard, myActions, isLoading, lastUpdated, refresh } =
    useQuestLiveData({ quest, isAuthenticated: Boolean(isAuthenticated) });

  const loadMemberData = useCallback(() => refresh(), [refresh]);

  /**
   * A ticket source points at an event by id, but a member needs its page —
   * so resolve the handful a quest references into slugs and names.
   */
  const [eventsById, setEventsById] = useState<
    Record<string, { slug?: string; name?: string }>
  >({});

  useEffect(() => {
    if (!quest) return;
    const ids = getLinkedEventIds(quest);
    if (!ids.length) return;
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        api
          .get(`/event/${id}`)
          .then((res) => [id, res?.data?.results] as const)
          .catch(() => [id, null] as const),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setEventsById(
        Object.fromEntries(
          entries
            .filter(([, event]) => Boolean(event))
            .map(([id, event]) => [id, { slug: event.slug, name: event.name }]),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [quest]);

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the URL bar still has the link.
    }
  };

  if (!isQuestsEnabled) {
    return <FeatureNotEnabled feature="quests" />;
  }

  if (!quest) {
    return <PageNotFound error={error || undefined} />;
  }

  const countdownTarget = getQuestCountdownTarget(quest);
  const isOpen = isQuestOpen(quest);
  const isClosed = quest.status === 'locked' || quest.status === 'settled';
  const description = quest.description || quest.shortDescription;

  return (
    <>
      <Head>
        <title>{`${quest.title} - ${t(
          'quests_title',
        )} - ${PLATFORM_NAME}`}</title>
        <meta
          name="description"
          content={quest.shortDescription || quest.description || quest.title}
        />
        <meta property="og:title" content={quest.title} />
        <meta
          property="og:description"
          content={quest.shortDescription || quest.description || quest.title}
        />
        <meta property="og:type" content="website" />
      </Head>

      <div className="main-content w-full mb-12">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/quests"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('quests_back')}
          </Link>
          {isQuestAdmin && (
            <Link
              href={`/quests/${quest.slug}/edit`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-600 hover:text-accent hover:border-accent"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t('quests_card_edit')}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
          <div>
            <div className="text-center mb-7">
              {quest.visual?.emoji && (
                <div className="text-5xl mb-2">{quest.visual.emoji}</div>
              )}
              <Heading level={1} display className="mb-3">
                {quest.title}
              </Heading>

              <div className="flex justify-center gap-2 flex-wrap">
                <QuestStatusBadge status={quest.status} />
                {quest.roleRequired?.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-full bg-accent-light text-accent px-3 py-1 text-xs font-bold uppercase tracking-wide"
                  >
                    {role}
                  </span>
                ))}
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {hasCopied ? t('quests_link_copied') : t('quests_copy_link')}
                </button>
              </div>

              {description && (
                <p className="mt-4 mx-auto max-w-xl text-gray-600 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {countdownTarget && (
              <div className="mb-8">
                <QuestCountdown
                  target={countdownTarget}
                  label={
                    isOpen
                      ? t('quests_countdown_closes', {
                          date: dayjs(quest.end).format('MMM D, HH:mm'),
                        })
                      : t('quests_countdown_opens', {
                          date: dayjs(quest.start).format('MMM D, HH:mm'),
                        })
                  }
                />
              </div>
            )}

            {!countdownTarget && (
              <p className="text-center text-sm text-gray-500 mb-8">
                {getQuestDateRange(quest)}
              </p>
            )}

            <QuestPrizes quest={quest} />

            {isClosed && (
              <QuestWinners quest={quest} initialUsers={winnerUsers} />
            )}

            {isQuestAdmin && (
              <QuestAdminPanel
                quest={quest}
                onChanged={async () => {
                  await Promise.all([refreshQuest(), loadMemberData()]);
                }}
              />
            )}

            {isAuthenticated && isOpen && (
              <QuestActionForm
                quest={quest}
                me={me}
                myActions={myActions}
                onSubmitted={loadMemberData}
              />
            )}

            {showLeaderboard && (
              <QuestLeaderboard
                quest={quest}
                leaderboard={leaderboard}
                isLoading={isLoading}
                lastUpdated={isOpen ? lastUpdated : null}
                onRefresh={isOpen ? loadMemberData : undefined}
              />
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            {isOpen && (
              <QuestEntryPanel
                quest={quest}
                me={me}
                totalTickets={leaderboard?.totalTickets}
                isAuthenticated={Boolean(isAuthenticated)}
                isLoading={isLoading}
                eventsById={eventsById}
                bookingToken={web3Config?.bookingToken}
              />
            )}
            <QuestHowItWorks quest={quest} />
          </aside>
        </div>
      </div>
    </>
  );
};

QuestPage.getInitialProps = async (context: NextPageContext) => {
  const { req, query } = context;
  try {
    const quest = await getQuest(String(query.slug), {
      req: req as NextApiRequest,
    });

    // Winners come back as ids, so put names on them before the page renders.
    const unnamedWinnerIds = (quest?.results?.winners || [])
      .filter((winner) => !winner.screenname && winner.userId)
      .map((winner) => winner.userId);
    const winnerUsers = unnamedWinnerIds.length
      ? await getQuestUsers(unnamedWinnerIds, {
          req: req as NextApiRequest,
        }).catch(() => [])
      : [];

    return {
      quest,
      winnerUsers,
      generalConfig: config.general || null,
      questsConfig: config.quests || null,
      web3Config: config.web3 || null,
      error: null,
    };
  } catch (err: unknown) {
    return {
      quest: null,
      winnerUsers: [],
      generalConfig: config.general || null,
      questsConfig: config.quests || null,
      web3Config: config.web3 || null,
      error: parseMessageFromError(err),
    };
  }
};

export default QuestPage;
