import { Village } from '../types/village';

/**
 * The self-checkout funnel: the five steps that take somebody from "I typed my
 * name into the application modal" to "my village is running on Closer".
 *
 * Before this existed each surface told its own version of the story — the
 * application modal counted three steps, the village page counted five
 * different ones, and signup/subscriptions counted none — so an applicant could
 * not tell where they were or what came next. Every surface now reads the same
 * five steps and the same "next step" prompt from here.
 */
export const VILLAGE_FUNNEL_STEPS = [
  'application',
  'account',
  'subscription',
  'village',
  'deploy',
] as const;

export type VillageFunnelStep = (typeof VILLAGE_FUNNEL_STEPS)[number];

/** The village fields the funnel needs — a full `Village` satisfies it. */
export type VillageFunnelVillage = Pick<
  Village,
  '_id' | 'slug' | 'onboardingStatus'
>;

/**
 * What each surface knows about the visitor. Everything is optional because no
 * single page knows all of it: the application modal knows the application was
 * just sent, /signup knows the stored answers, the village page knows the
 * village. The resolver fills the gaps by implication.
 */
export type VillageFunnelFacts = {
  hasApplication?: boolean;
  isAuthenticated?: boolean;
  hasSubscription?: boolean;
  village?: VillageFunnelVillage | null;
};

export type VillageFunnelStepState = {
  step: VillageFunnelStep;
  index: number;
  isDone: boolean;
  isCurrent: boolean;
};

export const villageFunnelPath = (village: VillageFunnelVillage) =>
  `/villages/${village.slug || village._id}`;

/** Deploy is only finished once procurement has the village running. */
const isDeployDone = (village?: VillageFunnelVillage | null) =>
  village?.onboardingStatus === 'live' ||
  village?.onboardingStatus === 'suspended';

/**
 * Later facts imply the earlier steps: somebody holding a subscription has an
 * account whether or not this page can see it, and a village implies both. That
 * keeps the strip monotonic — no surface ever draws a done step after a pending
 * one, which is the thing that made the old per-page steppers unreadable.
 */
export const getVillageFunnelDoneFlags = (
  facts: VillageFunnelFacts,
): boolean[] => {
  const hasVillage = Boolean(facts.village);
  const hasSubscription = Boolean(facts.hasSubscription) || hasVillage;
  const isAuthenticated = Boolean(facts.isAuthenticated) || hasSubscription;
  const hasApplication = Boolean(facts.hasApplication) || isAuthenticated;
  return [
    hasApplication,
    isAuthenticated,
    hasSubscription,
    hasVillage,
    isDeployDone(facts.village),
  ];
};

export const getVillageFunnelSteps = (
  facts: VillageFunnelFacts,
): VillageFunnelStepState[] => {
  const done = getVillageFunnelDoneFlags(facts);
  const currentIndex = done.indexOf(false);
  return VILLAGE_FUNNEL_STEPS.map((step, index) => ({
    step,
    index,
    isDone: done[index],
    isCurrent: index === currentIndex,
  }));
};

/** 0…4 while there is something left to do, 5 once the village is live. */
export const getVillageFunnelIndex = (facts: VillageFunnelFacts): number => {
  const index = getVillageFunnelDoneFlags(facts).indexOf(false);
  return index === -1 ? VILLAGE_FUNNEL_STEPS.length : index;
};

export type VillageFunnelPrompt = {
  step: VillageFunnelStep;
  index: number;
  /** Where the CTA goes. `null` means "open the application modal". */
  href: string | null;
};

/**
 * The one thing to ask for next. `null` once every step is done — a live
 * village has nothing left to be prompted about.
 */
export const getVillageFunnelPrompt = (
  facts: VillageFunnelFacts,
): VillageFunnelPrompt | null => {
  const index = getVillageFunnelIndex(facts);
  if (index >= VILLAGE_FUNNEL_STEPS.length) return null;
  const step = VILLAGE_FUNNEL_STEPS[index];
  const hrefs: Record<VillageFunnelStep, string | null> = {
    application: null,
    // Coming back to plans is the whole point of signing up from here.
    account: `/signup?back=${encodeURIComponent('/subscriptions')}`,
    subscription: '/subscriptions',
    village: '/village/launch',
    deploy: facts.village
      ? villageFunnelPath(facts.village)
      : '/village/launch',
  };
  return { step, index, href: hrefs[step] };
};

/** The funnel only exists where villages do. */
export const isVillageFunnelEnabled = () =>
  process.env.NEXT_PUBLIC_FEATURE_FEDERATION === 'true';

/** The `fields` key the guaranteed website question is stored under. */
export const VILLAGE_WEBSITE_FIELD_NAME = 'website';

const WEBSITE_QUESTION_NAMES = new Set([
  'website',
  'websiteurl',
  'projectwebsite',
  'url',
  'link',
  'deck',
  'pitchdeck',
  'websitedeck',
  'websiteordeck',
]);

/**
 * Whether the platform's own application questions already ask for a link.
 * A village needs a website or deck to be worth listing, so where the funnel
 * runs the modal appends the question when this is false — a platform whose
 * saved config predates the question still asks it, while one that phrased
 * its own link question keeps it and is not asked twice.
 */
export const hasVillageWebsiteQuestion = (
  fields: readonly { name: string; type?: string }[],
): boolean =>
  fields.some(
    (field) =>
      field.type === 'url' ||
      WEBSITE_QUESTION_NAMES.has(
        field.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      ),
  );
