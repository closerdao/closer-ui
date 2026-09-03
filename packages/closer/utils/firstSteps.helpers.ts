import { isConfigUnlockedByEnv } from '../constants/featureFlags';
import {
  FIRST_STEPS,
  FIRST_STEPS_FEATURES,
  FirstStepDefinition,
  FirstStepId,
  isFirstStepId,
} from '../constants/firstSteps';
import { STANDARD_PAGE_IDS_PREFIX } from '../constants/standardPages';
import { PageListItem } from './standardPages';

/**
 * Progress through `/first-steps` is derived from what the instance actually
 * looks like, never from a box somebody ticked.
 *
 * That matters more than it sounds. Setup is done by a founding team, not one
 * person: a second admin opening the wizard should see the work their
 * co-founder already did, and somebody who later empties their platform name
 * should see that step reopen. Stored checkmarks give neither. The only things
 * kept per user are deliberate skips of optional steps, which are a statement
 * of intent rather than a fact about the instance.
 */
export interface FirstStepsFacts {
  /** Live config, keyed by slug. Not the build-time snapshot. */
  config: Record<string, Record<string, any>>;
  /** Pages already stored, merged with the virtual standard pages. */
  pages: PageListItem[];
  listingCount: number;
  foodCount: number;
  /** Optional steps this user has chosen to skip. */
  skipped: FirstStepId[];
  /** A deploy has been triggered since setup last changed. */
  hasDeployed: boolean;
}

export const emptyFirstStepsFacts = (): FirstStepsFacts => ({
  config: {},
  pages: [],
  listingCount: 0,
  foodCount: 0,
  skipped: [],
  hasDeployed: false,
});

const hasText = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * A feature is live only when both gates pass: the build-time env flag and the
 * saved `enabled` value. A group with no env flag is governed by `enabled`
 * alone. Absence is always off — never inferred as on.
 */
export const isFeatureLive = (
  slug: string,
  config: FirstStepsFacts['config'],
): boolean => isConfigUnlockedByEnv(slug) && config?.[slug]?.enabled === true;

/** A page that exists only as a template still carries its `std:` id. */
const isRealPage = (page: PageListItem): boolean =>
  Boolean(page?._id) && !String(page._id).startsWith(STANDARD_PAGE_IDS_PREFIX);

/**
 * The steps this instance should show. A step gated on a feature disappears
 * entirely when that feature is off — a village not taking bookings should
 * never be asked about check-in times.
 */
export const getVisibleFirstSteps = (
  facts: FirstStepsFacts,
): FirstStepDefinition[] =>
  FIRST_STEPS.filter(
    (step) =>
      !step.requiresFeature ||
      isFeatureLive(step.requiresFeature, facts.config),
  );

export const isFirstStepDone = (
  id: FirstStepId,
  facts: FirstStepsFacts,
): boolean => {
  const config = facts.config ?? {};

  switch (id) {
    case 'identity': {
      const general = config.general ?? {};
      return (
        hasText(general.platformName) &&
        hasText(general.teamEmail) &&
        hasText(general.country)
      );
    }

    case 'theme':
      // A saved primary colour is the one signal that somebody chose rather
      // than inherited: the shipped default leaves it empty.
      return hasText(config.theming?.primaryColor);

    case 'features':
      // Done once the admin has made a decision at all. Saving a group writes
      // an explicit boolean, so "they thought about it" is distinguishable
      // from "nobody has been here yet".
      return FIRST_STEPS_FEATURES.some(
        (feature) => typeof config[feature.slug]?.enabled === 'boolean',
      );

    case 'pages':
      // The home page is the one every village needs, whatever else they run.
      return facts.pages.some((page) => page?.slug === '/' && isRealPage(page));

    case 'money': {
      const entities = config['accounting-entities']?.elements;
      return (
        config.payment?.enabled === true &&
        Array.isArray(entities) &&
        entities.some((entity: any) => hasText(entity?.legalName))
      );
    }

    case 'stays': {
      if (facts.listingCount < 1) return false;
      // Food is only part of the job when the village turned it on.
      if (config.booking?.foodOptionEnabled === true) {
        return facts.foodCount > 0;
      }
      return true;
    }

    case 'team':
      // Nothing observable distinguishes "invited my co-founders" from "runs
      // this alone", so this one is advisory: it completes by being skipped.
      return false;

    case 'launch':
      return facts.hasDeployed;

    default:
      return false;
  }
};

export interface FirstStepState {
  id: FirstStepId;
  /** 1-based position among the visible steps. */
  index: number;
  isDone: boolean;
  isSkipped: boolean;
  isCurrent: boolean;
  required: boolean;
}

export interface FirstStepsProgress {
  steps: FirstStepState[];
  /** Steps done or deliberately skipped, out of `total`. */
  doneCount: number;
  total: number;
  /** The first step still wanting attention, or null when there is none. */
  nextStepId: FirstStepId | null;
  /** Every required, unskipped step is done. */
  isComplete: boolean;
}

export const getFirstStepsProgress = (
  facts: FirstStepsFacts,
  currentStepId?: FirstStepId | null,
): FirstStepsProgress => {
  const visible = getVisibleFirstSteps(facts);
  const skipped = new Set(facts.skipped ?? []);

  const resolved = visible.map((step, position) => {
    const isSkipped = skipped.has(step.id);
    return {
      id: step.id,
      index: position + 1,
      isDone: isFirstStepDone(step.id, facts),
      isSkipped,
      required: step.required,
    };
  });

  const nextStepId =
    resolved.find((step) => !step.isDone && !step.isSkipped)?.id ?? null;

  const steps: FirstStepState[] = resolved.map((step) => ({
    ...step,
    isCurrent: currentStepId
      ? step.id === currentStepId
      : step.id === nextStepId,
  }));

  return {
    steps,
    doneCount: steps.filter((step) => step.isDone || step.isSkipped).length,
    total: steps.length,
    nextStepId,
    // A required step cannot be skipped out of existence — only an optional
    // one clears by being skipped.
    isComplete: steps.every((step) =>
      step.required ? step.isDone : step.isDone || step.isSkipped,
    ),
  };
};

/** Neighbours of a step, for the footer navigation. */
export const getAdjacentFirstSteps = (
  facts: FirstStepsFacts,
  currentStepId: FirstStepId,
): { previousId: FirstStepId | null; nextId: FirstStepId | null } => {
  const visible = getVisibleFirstSteps(facts);
  const position = visible.findIndex((step) => step.id === currentStepId);
  if (position === -1) return { previousId: null, nextId: null };
  return {
    previousId: position > 0 ? visible[position - 1].id : null,
    nextId: position < visible.length - 1 ? visible[position + 1].id : null,
  };
};

/**
 * Which step to open. An explicit, still-visible `?step=` wins; otherwise pick
 * up where the instance left off, and fall back to the first step once
 * everything is done so the page is never blank.
 */
export const resolveFirstStep = (
  facts: FirstStepsFacts,
  requestedStep?: string | string[] | null,
): FirstStepId => {
  const visible = getVisibleFirstSteps(facts);
  const requested = Array.isArray(requestedStep)
    ? requestedStep[0]
    : requestedStep;

  if (
    isFirstStepId(requested) &&
    visible.some((step) => step.id === requested)
  ) {
    return requested;
  }

  const { nextStepId } = getFirstStepsProgress(facts);
  return nextStepId ?? visible[0]?.id ?? 'identity';
};

/* -------------------------------------------------------------------------- */
/* Per-user state                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Skips and the one-time redirect flag, stored under `user.settings`.
 *
 * `PATCH /user/:id` replaces `settings` wholesale, so every write must go
 * through `mergeUserSettings` or it silently wipes unrelated keys.
 */
export interface FirstStepsUserState {
  skipped: FirstStepId[];
  /** The admin has been sent here automatically once. Never do it again. */
  hasBeenRedirected: boolean;
  /** The dashboard banner has been dismissed. */
  hasDismissedBanner: boolean;
  /**
   * A deploy has been triggered from here.
   *
   * Unlike every other step, this one has nothing observable to derive from:
   * there is no endpoint that says whether a build has run. Recording the
   * deploy we did witness is the honest alternative to leaving the last step
   * permanently outstanding, which would make the dashboard banner nag forever.
   * It is per-user, so a co-founder still sees the step open — and deploying
   * again costs nothing.
   */
  hasDeployed: boolean;
}

export const FIRST_STEPS_SETTINGS_KEY = 'first_steps';

export const emptyFirstStepsUserState = (): FirstStepsUserState => ({
  skipped: [],
  hasBeenRedirected: false,
  hasDismissedBanner: false,
  hasDeployed: false,
});

/** Rebuilds stored state, dropping anything that no longer looks like it. */
export const parseFirstStepsUserState = (raw: unknown): FirstStepsUserState => {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return emptyFirstStepsUserState();
  }
  const value = raw as Record<string, unknown>;
  const skipped = Array.isArray(value.skipped)
    ? value.skipped.filter(isFirstStepId)
    : [];
  return {
    skipped,
    hasBeenRedirected: value.hasBeenRedirected === true,
    hasDismissedBanner: value.hasDismissedBanner === true,
    hasDeployed: value.hasDeployed === true,
  };
};

export const firstStepsStorageKey = (userId: string): string =>
  `first-steps-state-${userId}`;

/**
 * Union of what is on the user record and what is in this browser, so a skip
 * made while a patch was still in flight is never lost. Mirrors the approach
 * `pages/token/onboarding.tsx` uses for quest claims.
 */
export const mergeFirstStepsUserState = (
  local: FirstStepsUserState,
  remote: FirstStepsUserState,
): FirstStepsUserState => ({
  skipped: Array.from(new Set([...local.skipped, ...remote.skipped])),
  hasBeenRedirected: local.hasBeenRedirected || remote.hasBeenRedirected,
  hasDismissedBanner: local.hasDismissedBanner || remote.hasDismissedBanner,
  hasDeployed: local.hasDeployed || remote.hasDeployed,
});

export const toggleSkippedStep = (
  state: FirstStepsUserState,
  id: FirstStepId,
): FirstStepsUserState => ({
  ...state,
  skipped: state.skipped.includes(id)
    ? state.skipped.filter((stepId) => stepId !== id)
    : [...state.skipped, id],
});
