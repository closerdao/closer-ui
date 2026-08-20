import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import CarrotRail from '../../components/TokenOnboarding/CarrotRail';
import QuestBody from '../../components/TokenOnboarding/QuestBody';
import QuestGate, {
  QuestGateState,
  emptyGateState,
  isGatePassed,
} from '../../components/TokenOnboarding/QuestGate';
import {
  WalletGateStatus,
  isWalletGatePassed,
} from '../../components/TokenOnboarding/WalletGate';
import Wallet from '../../components/Wallet';
import { BackButton, Button, Heading } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import {
  OnboardingQuest,
  TOKEN_ONBOARDING_TOTAL_CARROTS,
  getTokenOnboardingQuests,
} from '../../constants/tokenOnboardingQuests';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useWalletState } from '../../contexts/wallet/hooks';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import { userHasLinkedWallet } from '../../utils/auth.helpers';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getGasTokenDisplay } from '../../utils/config.utils';
import { logMetric } from '../../utils/metrics';
import { awardOnboardingCarrots } from '../../utils/tokenOnboarding.api';
import {
  carrotsEarned,
  formatCarrots,
  isOnboardingComplete,
  isQuestUnlocked,
  nextQuestIndex,
  parseOnboardingProgress,
} from '../../utils/tokenOnboarding.helpers';
import PageNotFound from '../not-found';

const SUPPORT_CHANNEL_URL = 'https://t.me/+bW0K8E7ZGVE4ZjBh';

const progressStorageKey = (userId: string) =>
  `token-onboarding-progress-${userId}`;

/** The navigation bar is fixed at 80px; clear it plus a little air. */
const SCROLL_OFFSET = 96;

/**
 * Put the top of the section just under the navigation, so the member reads a
 * quest from its title rather than landing in the middle of it.
 */
const scrollToHead = (element: HTMLElement | null | undefined) => {
  if (!element) return;
  if (typeof element.getBoundingClientRect === 'function') {
    const top =
      element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    return;
  }
  // Scrolling is a convenience; never let a missing implementation break a
  // claim that has already been awarded and stored.
  if (typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/** 'CELO SEPOLIA' reads as shouting in prose. */
const humanNetworkName = (name: string) =>
  name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

const OnboardingPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const defaultConfig = useConfig();
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const { user, refetchUser } = useAuth();
  const { platform }: any = usePlatform();
  const {
    isWalletConnected,
    isCorrectNetwork,
    hasSameConnectedAccount,
    account,
  } = useWalletState();

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const gasToken = getGasTokenDisplay(defaultConfig);
  const semanticUrl =
    (generalConfig as { semanticUrl?: string } | null)?.semanticUrl ||
    (defaultConfig as { semanticUrl?: string })?.semanticUrl ||
    '';

  // Memoised on primitives only: `getCachedConfig` rebuilds its object on every
  // call, so depending on the config objects would hand back a new `quests`
  // array each render and re-run the restore effect forever.
  const quests = useMemo(
    () =>
      getTokenOnboardingQuests({
        tokenSymbol: blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
        platformName: PLATFORM_NAME,
        networkName: humanNetworkName(blockchainConfig.BLOCKCHAIN_NAME),
        gasToken,
        semanticUrl,
        canConnectWallet: isWalletEnabled,
      }),
    [PLATFORM_NAME, gasToken, semanticUrl, isWalletEnabled],
  );

  // The last quest is claimed against this, not against a box the member ticks.
  const walletStatus: WalletGateStatus = {
    isWalletConnected: Boolean(isWalletConnected),
    isCorrectNetwork: Boolean(isCorrectNetwork),
    isLinkedToProfile: Boolean(
      userHasLinkedWallet(user) && hasSameConnectedAccount,
    ),
    account,
  };

  const [completed, setCompleted] = useState<string[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const [openQuestId, setOpenQuestId] = useState<string | null>(
    quests[0]?.id ?? null,
  );
  const [gateStates, setGateStates] = useState<Record<string, QuestGateState>>(
    {},
  );
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const [pendingCarrotQuestIds, setPendingCarrotQuestIds] = useState<string[]>(
    [],
  );

  const questRefs = useRef<Record<string, HTMLElement | null>>({});
  const entryMetricLogged = useRef(false);

  useEffect(() => {
    if (entryMetricLogged.current) return;
    entryMetricLogged.current = true;
    void logMetric({
      event: 'token-onboarding-started',
      category: 'token',
      value: 'onboarding-entry',
    });
  }, []);

  // Restore from the local cache first so the page paints where the member left
  // off, then let the user record — the durable copy — fill in anything newer.
  useEffect(() => {
    if (!user?._id) {
      setIsRestored(true);
      return;
    }

    const stored =
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(progressStorageKey(user._id));
    const local = parseOnboardingProgress(stored, quests).completed;
    const remote = parseOnboardingProgress(
      (user.settings as { token_onboarding_progress?: unknown } | undefined)
        ?.token_onboarding_progress,
      quests,
    ).completed;
    const merged = quests
      .map((quest) => quest.id)
      .filter((id) => local.includes(id) || remote.includes(id));

    setCompleted(merged);
    setOpenQuestId(
      quests[Math.max(nextQuestIndex(merged, quests), 0)]?.id ?? null,
    );
    setIsRestored(true);
    // Runs once the member is known. Later `refetchUser` calls keep the same id,
    // so a fresh user object cannot clobber a claim made in this session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, quests]);

  const isWalletVerified = isWalletGatePassed(walletStatus);

  const gateStateFor = useCallback(
    (quest: OnboardingQuest): QuestGateState => {
      const state = gateStates[quest.id] ?? emptyGateState(quest);
      return quest.gate.type === 'wallet'
        ? { ...state, isWalletVerified }
        : state;
    },
    [gateStates, isWalletVerified],
  );

  const updateGateState = (
    quest: OnboardingQuest,
    change: (state: QuestGateState) => QuestGateState,
  ) => {
    setGateStates((previous) => ({
      ...previous,
      [quest.id]: change(previous[quest.id] ?? emptyGateState(quest)),
    }));
  };

  const handlePick = (quest: OnboardingQuest, optionIndex: number) => {
    const gate = quest.gate;
    if (gate.type !== 'quiz') return;
    const isRight = optionIndex === gate.correctIndex;
    updateGateState(quest, (state) => ({
      ...state,
      picked: optionIndex,
      wrongPicks: isRight
        ? // Everything the member did not pick is now visibly ruled out.
          gate.options
            .map((_, index) => index)
            .filter((index) => index !== optionIndex)
        : state.wrongPicks.includes(optionIndex)
        ? state.wrongPicks
        : [...state.wrongPicks, optionIndex],
    }));
  };

  const handleToggleCheck = (quest: OnboardingQuest, itemIndex: number) => {
    updateGateState(quest, (state) => {
      const checks = [...state.checks];
      checks[itemIndex] = !checks[itemIndex];
      return { ...state, checks };
    });
  };

  const persistProgress = async (nextCompleted: string[], userId: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        progressStorageKey(userId),
        JSON.stringify({ completed: nextCompleted }),
      );
    }
    try {
      await platform.user.patch(userId, {
        settings: { token_onboarding_progress: { completed: nextCompleted } },
      });
      await refetchUser();
    } catch {
      // The local cache already holds the claim; a failed patch must not undo
      // a quest the member has finished.
    }
  };

  const handleClaim = async (quest: OnboardingQuest) => {
    if (!user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (completed.includes(quest.id) || claimingQuestId) return;
    if (!isGatePassed(quest, gateStateFor(quest))) return;

    setClaimingQuestId(quest.id);
    try {
      const award = await awardOnboardingCarrots(quest);
      if (award.status === 'unavailable') {
        setPendingCarrotQuestIds((previous) =>
          previous.includes(quest.id) ? previous : [...previous, quest.id],
        );
      }

      const nextCompleted = quests
        .map((item) => item.id)
        .filter((id) => completed.includes(id) || id === quest.id);
      setCompleted(nextCompleted);

      void logMetric({
        event: 'token-onboarding-quest-claimed',
        category: 'token',
        value: quest.id,
        point: quest.carrots,
      });

      const next = nextQuestIndex(nextCompleted, quests);
      setOpenQuestId(next === -1 ? null : quests[next].id);

      // Scroll before persisting: the member should be looking at the next
      // quest immediately, not once a network round trip comes back. One frame
      // is enough for this quest to collapse and the next one to open, so the
      // head we measure is where it will actually be.
      await new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => resolve());
        } else {
          resolve();
        }
      });
      scrollToHead(
        next === -1
          ? questRefs.current.finale
          : questRefs.current[quests[next].id],
      );

      await persistProgress(nextCompleted, user._id);
    } finally {
      setClaimingQuestId(null);
    }
  };

  const handleReset = async () => {
    setCompleted([]);
    setGateStates({});
    setPendingCarrotQuestIds([]);
    setOpenQuestId(quests[0]?.id ?? null);
    if (user?._id) {
      await persistProgress([], user._id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  const doneCount = quests.filter((quest) => completed.includes(quest.id))
    .length;
  const earned = carrotsEarned(completed, quests);
  const isComplete = isOnboardingComplete(completed, quests);

  return (
    <>
      <Head>
        <title>{`${t('token_onboarding_title')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={() => router.push('/token')}>
          {t('buttons_back')}
        </BackButton>

        <Heading level={1} className="mb-6">
          🥕 {t('token_onboarding_title')}
        </Heading>

        <CarrotRail
          quests={quests}
          completed={completed}
          earned={earned}
          total={TOKEN_ONBOARDING_TOTAL_CARROTS}
          label={
            isComplete
              ? t('token_onboarding_all_complete')
              : t('token_onboarding_quest_counter', {
                  current: doneCount + 1,
                  total: quests.length,
                })
          }
        />

        <main className="pb-24 flex flex-col gap-4">
          <p className="text-lg max-w-[64ch]">
            {t('token_onboarding_intro', {
              carrots: TOKEN_ONBOARDING_TOTAL_CARROTS,
              questCount: quests.length,
            })}
          </p>
          <p className="text-sm text-complimentary-light max-w-[64ch]">
            {t('token_onboarding_carrots_note')}
          </p>

          <div className="mt-6 border-t border-line/40">
            {quests.map((quest, index) => {
              const isDone = completed.includes(quest.id);
              const isUnlocked = isQuestUnlocked(index, completed, quests);
              const isOpen = openQuestId === quest.id;

              return (
                <section
                  key={quest.id}
                  ref={(element) => {
                    questRefs.current[quest.id] = element;
                  }}
                  className="border-b border-line/40"
                >
                  <button
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => setOpenQuestId(isOpen ? null : quest.id)}
                    className={`flex w-full items-start gap-4 py-5 text-left ${
                      isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 text-base font-bold transition-colors ${
                        isDone
                          ? 'border-accent bg-accent text-accent-foreground'
                          : isUnlocked
                          ? 'border-accent text-accent'
                          : 'border-line/40 text-disabled'
                      }`}
                    >
                      {isDone
                        ? '✓'
                        : isUnlocked
                        ? String(index + 1).padStart(2, '0')
                        : '🔒'}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-xl font-bold ${
                          isUnlocked ? '' : 'text-disabled'
                        }`}
                      >
                        {quest.title}
                      </span>
                      <span
                        className={`block text-base ${
                          isUnlocked
                            ? 'text-complimentary-light'
                            : 'text-disabled'
                        }`}
                      >
                        {quest.subtitle}
                      </span>
                    </span>
                    <span
                      className={`mt-1.5 hidden flex-none text-sm font-bold sm:block ${
                        isUnlocked ? 'text-accent-core' : 'text-disabled'
                      }`}
                    >
                      {formatCarrots(quest.carrots)} 🥕
                    </span>
                  </button>

                  {isOpen && isUnlocked && (
                    <div className="pb-8 sm:pl-[52px]">
                      <QuestBody blocks={quest.body} />
                      <QuestGate
                        quest={quest}
                        state={gateStateFor(quest)}
                        isClaimed={isDone}
                        isClaiming={claimingQuestId === quest.id}
                        hasPendingCarrots={pendingCarrotQuestIds.includes(
                          quest.id,
                        )}
                        onPick={(optionIndex) => handlePick(quest, optionIndex)}
                        onToggleCheck={(itemIndex) =>
                          handleToggleCheck(quest, itemIndex)
                        }
                        onClaim={() => handleClaim(quest)}
                        walletStatus={walletStatus}
                      />
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div
            ref={(element) => {
              questRefs.current.finale = element;
            }}
            className={`mt-10 rounded-2xl border-2 p-8 text-center ${
              isComplete
                ? 'border-accent bg-accent-light/40'
                : 'border-line/40'
            }`}
          >
            <Heading level={2} className="mb-2.5">
              {isComplete
                ? t('token_onboarding_finale_heading_ready')
                : t('token_onboarding_finale_heading_locked')}
            </Heading>
            <p className="mx-auto max-w-[52ch] text-complimentary-light">
              {isComplete
                ? t('token_onboarding_finale_text_ready')
                : t('token_onboarding_finale_text_locked', {
                    questCount: quests.length,
                  })}
            </p>
            <Button
              className="mt-5"
              isEnabled={isComplete}
              onClick={() => {
                void logMetric({
                  event: 'token-onboarding-completed',
                  category: 'token',
                  value: 'buy-tokens',
                  point: TOKEN_ONBOARDING_TOTAL_CARROTS,
                });
                router.push('/token/before-you-begin');
              }}
            >
              {t('token_onboarding_buy_cta')}
            </Button>
            <p className="mt-4 text-base text-complimentary-light">
              {t.rich('token_onboarding_finale_alt', {
                stayLink: (chunks) => (
                  <Link className="text-accent underline" href="/stay">
                    {chunks}
                  </Link>
                ),
                helpLink: (chunks) => (
                  <a
                    className="text-accent underline"
                    href={SUPPORT_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>

          {isWalletEnabled && (
            <div className="mt-8 mb-4">
              <Wallet />
            </div>
          )}

          <div>
            <Heading level={3} hasBorder={true}>
              ? {t('token_sale_before_you_begin_need_help_heading')}
            </Heading>
            <ul>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={t('token_sale_before_you_begin_guide_1_link')}
                >
                  {t('token_sale_before_you_begin_guide_1')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={t('token_sale_before_you_begin_guide_2_link')}
                >
                  {t('token_sale_before_you_begin_guide_2')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={SUPPORT_CHANNEL_URL}
                >
                  {t('token_sale_before_you_begin_guide_4')}
                </Link>
              </li>
            </ul>
          </div>

          {isRestored && doneCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="mx-auto mt-8 text-sm text-disabled underline"
            >
              {t('token_onboarding_reset')}
            </button>
          )}
        </main>
      </div>
    </>
  );
};

export default OnboardingPage;
