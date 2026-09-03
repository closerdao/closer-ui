import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useMemo, useState } from 'react';

import StepNavBar from '../components/FirstSteps/StepNavBar';
import StepShell from '../components/FirstSteps/StepShell';
import FeaturesStep from '../components/FirstSteps/steps/FeaturesStep';
import IdentityStep from '../components/FirstSteps/steps/IdentityStep';
import LaunchStep from '../components/FirstSteps/steps/LaunchStep';
import MoneyStep from '../components/FirstSteps/steps/MoneyStep';
import PagesStep, {
  PagesStepRow,
} from '../components/FirstSteps/steps/PagesStep';
import StaysStep from '../components/FirstSteps/steps/StaysStep';
import TeamStep from '../components/FirstSteps/steps/TeamStep';
import ThemeStep from '../components/FirstSteps/steps/ThemeStep';
import Progress from '../components/ui/ProgressBar/Progress';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { configDescription } from '../config';
import {
  FIRST_STEPS_FEATURES,
  FirstStepId,
  getFirstStepDefinition,
} from '../constants/firstSteps';
import {
  AppConfigForStandardPages,
  buildDefaultStandardPageDoc,
  buildStandardPageVillageData,
  getEnabledStandardPages,
} from '../constants/standardPages';
import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { useFirstStepsStatus } from '../hooks/useFirstStepsStatus';
import { useRBAC } from '../hooks/useRBAC';
import { GeneralConfig } from '../types';
import api from '../utils/api';
import { getCachedConfig } from '../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../utils/common';
import {
  getDefaultConfigValue,
  saveConfigSection,
} from '../utils/config.utils';
import {
  getAdjacentFirstSteps,
  getFirstStepsProgress,
  resolveFirstStep,
  toggleSkippedStep,
} from '../utils/firstSteps.helpers';
import PageNotFound from './not-found';

/**
 * `/first-steps` — the guided setup a village walks after their instance is
 * deployed and before anybody visits it.
 *
 * `utils/villageFunnel.ts` models everything before this and ends at `deploy`,
 * leaving a running but empty instance. This is the missing last leg: the
 * decisions that matter, in the order they matter, ending with the build that
 * makes them visible.
 *
 * Progress is derived from live state rather than stored, so a second admin
 * sees what their co-founder already did and a value cleared later reopens its
 * step. See `useFirstStepsStatus` for why config is read live.
 */

const FEATURE_SLUGS = FIRST_STEPS_FEATURES.map((feature) => feature.slug);

const ACCOUNTING_SLUG = 'accounting-entities';

/** Config groups a step reads or writes, for seeding schema defaults. */
const EDITABLE_SLUGS = [
  'general',
  'theming',
  'booking',
  'payment',
  ACCOUNTING_SLUG,
];

const FirstStepsPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { platform }: any = usePlatform();
  const { hasAccess } = useRBAC();

  const {
    facts,
    liveConfig,
    teamUsers,
    userState,
    persistUserState,
    reload,
    reloadPages,
    markDeployed,
    isLoaded,
    error,
    setError,
  } = useFirstStepsStatus();

  /** Unsaved edits, keyed by config slug. */
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [creatingSlug, setCreatingSlug] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const schemaDefaults = useMemo(
    () =>
      EDITABLE_SLUGS.reduce<Record<string, Record<string, any>>>(
        (acc, slug) => {
          acc[slug] = getDefaultConfigValue(slug, configDescription);
          return acc;
        },
        {},
      ),
    [],
  );

  const currentStepId = resolveFirstStep(facts, router.query.step);
  const step = getFirstStepDefinition(currentStepId);
  const progress = getFirstStepsProgress(facts, currentStepId);
  const current = progress.steps.find((entry) => entry.id === currentStepId);
  const { previousId, nextId } = getAdjacentFirstSteps(facts, currentStepId);

  const goToStep = useCallback(
    (id: FirstStepId) => {
      router.push(
        { pathname: '/first-steps', query: { step: id } },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  /* --------------------------------------------------------------- edits */

  /** What a step edits: schema defaults, then saved config, then drafts. */
  const valueFor = useCallback(
    (slug: string): Record<string, any> => ({
      ...(schemaDefaults[slug] ?? {}),
      ...(liveConfig[slug] ?? {}),
      ...(drafts[slug] ?? {}),
    }),
    [schemaDefaults, liveConfig, drafts],
  );

  const editField = useCallback(
    (slug: string) => (key: string, value: any) => {
      setDrafts((previous) => ({
        ...previous,
        [slug]: { ...(previous[slug] ?? {}), [key]: value },
      }));
    },
    [],
  );

  const isDirty = useCallback(
    (slug: string) => Object.keys(drafts[slug] ?? {}).length > 0,
    [drafts],
  );

  const saveSlug = useCallback(
    async (slug: string, overrides: Record<string, any> = {}) => {
      setSavingSlug(slug);
      setError(null);
      try {
        await saveConfigSection(platform, slug, {
          ...valueFor(slug),
          ...overrides,
        });
        // Drafts sit on top of the live config, so they stay until the fresh
        // read lands; clearing them first shows the old values for a beat.
        await reload();
        setDrafts((previous) => {
          const next = { ...previous };
          delete next[slug];
          return next;
        });
      } catch (err) {
        setError(parseMessageFromError(err));
      } finally {
        setSavingSlug(null);
      }
    },
    [platform, valueFor, reload, setError],
  );

  /* --------------------------------------------------------------- steps */

  const toggleFeature = useCallback(
    (slug: string, enabled: boolean) => saveSlug(slug, { enabled }),
    [saveSlug],
  );

  /**
   * Seed a standard page from its shipped template.
   *
   * The village data is built from *live* config, so `{{platformName}}` and
   * friends resolve to what the admin typed in the identity step rather than to
   * the blank values the build-time snapshot was made with.
   */
  const createPage = useCallback(
    async (slug: string) => {
      setCreatingSlug(slug);
      setError(null);
      try {
        const village = buildStandardPageVillageData({
          general: liveConfig.general ?? {},
          token: liveConfig.token ?? {},
          citizenship: liveConfig.citizenship ?? {},
          featureConfig: liveConfig as AppConfigForStandardPages,
        });
        const doc = buildDefaultStandardPageDoc(slug, village);
        if (!doc) return;

        // `_id` is the `std:` virtual id and `isDefault` marks it as unsaved;
        // neither belongs on the record being created.
        const { _id, isDefault, ...payload } = doc;
        await platform.page.post(payload);
        await reloadPages();
      } catch (err) {
        setError(parseMessageFromError(err));
      } finally {
        setCreatingSlug(null);
      }
    },
    [platform, liveConfig, reloadPages, setError],
  );

  const deploy = useCallback(async () => {
    setIsDeploying(true);
    setError(null);
    try {
      await api.post('/deploy', {});
      await markDeployed();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsDeploying(false);
    }
  }, [markDeployed, setError]);

  const toggleSkip = useCallback(
    (id: FirstStepId) => persistUserState(toggleSkippedStep(userState, id)),
    [persistUserState, userState],
  );

  const pageRows: PagesStepRow[] = useMemo(() => {
    const bySlug = new Map(facts.pages.map((page) => [page.slug, page]));
    return (
      getEnabledStandardPages(liveConfig as AppConfigForStandardPages)
        .map((definition) => {
          const page = bySlug.get(definition.slug);
          return {
            definition,
            page,
            isCreated: Boolean(page && !page.isDefault),
          };
        })
        // The home page is the one every village needs, whatever else they run.
        .sort((a, b) =>
          a.definition.slug === '/' ? -1 : b.definition.slug === '/' ? 1 : 0,
        )
    );
  }, [facts.pages, liveConfig]);

  /* ---------------------------------------------------------------- gate */

  if (!user || !hasAccess('FirstSteps')) {
    return <PageNotFound error="User may not access" />;
  }

  const renderStep = () => {
    if (!step) return null;

    switch (step.id) {
      case 'identity':
        return (
          <IdentityStep
            step={step}
            value={valueFor('general')}
            onChange={editField('general')}
            onSave={() => saveSlug('general')}
            isSaving={savingSlug === 'general'}
            isDirty={isDirty('general')}
          />
        );

      case 'theme':
        return (
          <ThemeStep
            value={valueFor('theming')}
            onChange={editField('theming')}
            onSave={() => saveSlug('theming')}
            isSaving={savingSlug === 'theming'}
            isDirty={isDirty('theming')}
          />
        );

      case 'features':
        return (
          <FeaturesStep
            enabledBySlug={FEATURE_SLUGS.reduce<
              Record<string, boolean | undefined>
            >((acc, slug) => {
              acc[slug] = liveConfig[slug]?.enabled === true;
              return acc;
            }, {})}
            onToggle={toggleFeature}
            isSaving={Boolean(savingSlug)}
            savingSlug={savingSlug}
          />
        );

      case 'pages':
        return (
          <PagesStep
            rows={pageRows}
            onCreate={createPage}
            creatingSlug={creatingSlug}
          />
        );

      case 'money': {
        const entities = valueFor(ACCOUNTING_SLUG).elements;
        const entityList = Array.isArray(entities) ? entities : [];
        return (
          <MoneyStep
            step={step}
            paymentValue={valueFor('payment')}
            onPaymentChange={editField('payment')}
            entityValue={entityList[0] ?? {}}
            onEntityChange={(key, value) => {
              const next = [...entityList];
              next[0] = { ...(next[0] ?? {}), [key]: value };
              editField(ACCOUNTING_SLUG)('elements', next);
            }}
            onSave={async () => {
              await saveSlug('payment', { enabled: true });
              await saveSlug(ACCOUNTING_SLUG, { enabled: true });
            }}
            isSaving={
              savingSlug === 'payment' || savingSlug === ACCOUNTING_SLUG
            }
            isDirty={isDirty('payment') || isDirty(ACCOUNTING_SLUG)}
          />
        );
      }

      case 'stays':
        return (
          <StaysStep
            step={step}
            value={valueFor('booking')}
            onChange={editField('booking')}
            onSave={() => saveSlug('booking')}
            isSaving={savingSlug === 'booking'}
            isDirty={isDirty('booking')}
            listingCount={facts.listingCount}
            foodCount={facts.foodCount}
            isFoodEnabled={valueFor('booking').foodOptionEnabled === true}
          />
        );

      case 'team':
        return <TeamStep users={teamUsers} viewerId={user._id} />;

      case 'launch':
        return (
          <LaunchStep
            outstandingStepIds={progress.steps
              .filter(
                (entry) =>
                  !entry.isDone && !entry.isSkipped && entry.id !== 'launch',
              )
              .map((entry) => entry.id)}
            onGoToStep={goToStep}
            onDeploy={deploy}
            isDeploying={isDeploying}
            hasDeployed={facts.hasDeployed}
          />
        );

      default:
        return null;
    }
  };

  const platformName =
    (liveConfig.general?.platformName as string) ||
    (getCachedConfig('general') as GeneralConfig | null)?.platformName ||
    '';

  return (
    <>
      <Head>
        <title>{t('first_steps_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/*
        The app Layout steps aside for this route (see `isFullScreenRoute`), so
        the flow owns the viewport: its own header, its own progress, its own
        footer, and one way out.
      */}
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-neutral-dark bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-bold">
                {platformName || t('first_steps_title')}
              </span>
              {platformName && (
                <span className="truncate text-sm text-foreground/60">
                  {t('first_steps_title')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {current && (
                <span className="whitespace-nowrap text-sm text-foreground/60">
                  {t('first_steps_step_counter', {
                    current: current.index,
                    total: progress.total,
                  })}
                </span>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm underline"
                data-testid="first-steps-exit"
              >
                {t('first_steps_exit')}
                <X size={14} />
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-3xl px-5 pb-4">
            <Progress
              className="w-full"
              progress={current?.index ?? 1}
              total={progress.total}
              stepIds={progress.steps.map((entry) => entry.id)}
              stepHrefs={progress.steps.map(
                (entry) => `/first-steps?step=${entry.id}`,
              )}
              stepTitles={progress.steps.map((entry) => {
                const definition = getFirstStepDefinition(entry.id);
                return definition ? t(definition.titleKey) : entry.id;
              })}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
          {!isLoaded ? (
            <p>{t('generic_loading')}</p>
          ) : (
            step &&
            current && (
              <StepShell
                step={step}
                isDone={current.isDone}
                isSkipped={current.isSkipped}
                error={error}
              >
                {renderStep()}
              </StepShell>
            )
          )}
        </main>

        {isLoaded && step && current && (
          <StepNavBar
            step={step}
            isSkipped={current.isSkipped}
            previousId={previousId}
            nextId={nextId}
            onNavigate={goToStep}
            onToggleSkip={toggleSkip}
          />
        )}
      </div>
    </>
  );
};

export default FirstStepsPage;
