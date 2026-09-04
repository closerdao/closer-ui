/**
 * Which config groups an app is allowed to surface, and what unlocks each one.
 *
 * A feature in Closer is gated twice, and both gates have to pass:
 *
 *  1. A build-time `NEXT_PUBLIC_FEATURE_*` env var. Next.js inlines these at
 *     `next build`, so nothing in the running app can change one — the only fix
 *     is a new env value and a redeploy.
 *  2. The live `config.<slug>.enabled` flag, editable from the admin screens.
 *
 * These constants describe the first gate. They started out private to
 * `pages/admin/config.tsx`; `/first-steps` has to tell a new admin the same
 * story about the same features, and two copies of this map would drift apart
 * the first time a feature was added, so they live here now.
 */

/**
 * Config groups edited on a dedicated screen rather than the generic admin
 * form, and therefore hidden from the generic list.
 */
export const HIDDEN_CONFIGS = ['theming'];

/** Shipped, but still rough enough to warrant a warning next to the toggle. */
export const BETA_FEATURES = ['community', 'governance'];

/**
 * The env flag that unlocks each env-gated config group. A group missing from
 * this map is not env-gated at all and is governed solely by its live
 * `enabled` flag.
 */
export const FEATURE_FLAG_BY_CONFIG: Record<string, string> = {
  booking: 'NEXT_PUBLIC_FEATURE_BOOKING',
  'booking-rules': 'NEXT_PUBLIC_FEATURE_BOOKING',
  payment: 'NEXT_PUBLIC_FEATURE_BOOKING',
  volunteering: 'NEXT_PUBLIC_FEATURE_VOLUNTEERING',
  subscriptions: 'NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS',
  fundraiser: 'NEXT_PUBLIC_FEATURE_SUPPORT_US',
  learningHub: 'NEXT_PUBLIC_FEATURE_COURSES',
  courses: 'NEXT_PUBLIC_FEATURE_COURSES',
  citizenship: 'NEXT_PUBLIC_FEATURE_CITIZENSHIP',
  affiliate: 'NEXT_PUBLIC_FEATURE_AFFILIATE',
  blog: 'NEXT_PUBLIC_FEATURE_BLOG',
  roles: 'NEXT_PUBLIC_FEATURE_ROLES',
  residency: 'NEXT_PUBLIC_FEATURE_RESIDENCY',
  referral: 'NEXT_PUBLIC_FEATURE_REFERRAL',
  credit: 'NEXT_PUBLIC_FEATURE_CARROTS',
  airdrop: 'NEXT_PUBLIC_FEATURE_WEB3_WALLET',
  governance: 'NEXT_PUBLIC_FEATURE_WEB3_WALLET',
  token: 'NEXT_PUBLIC_FEATURE_WEB3_WALLET',
};

/** Config groups that are always available, whatever the environment says. */
const ALWAYS_ALLOWED_CONFIGS = [
  'general',
  'events',
  'applications',
  'cohousing',
  'engagement',
  'localization',
  'newsletter',
  'photo-gallery',
  'accounting-entities',
  'community',
  'webinar',
  'quests',
];

const isEnvFlagOn = (name: string): boolean => process.env[name] === 'true';

/**
 * The config groups this build is allowed to show at all.
 *
 * Read at call time rather than at module load: the test suite sets
 * `process.env.NEXT_PUBLIC_FEATURE_*` per case, and a module-level constant
 * would freeze whatever the first import happened to see.
 */
export const getEffectiveAllowedConfigs = (): string[] => {
  const isWeb3Enabled = isEnvFlagOn('NEXT_PUBLIC_FEATURE_WEB3_WALLET');
  const isWeb3BookingEnabled = isEnvFlagOn('NEXT_PUBLIC_FEATURE_WEB3_BOOKING');

  return [
    ...ALWAYS_ALLOWED_CONFIGS,
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_BOOKING')
      ? ['booking', 'booking-rules', 'payment']
      : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_VOLUNTEERING')
      ? ['volunteering']
      : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS')
      ? ['subscriptions']
      : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_SUPPORT_US') ? ['fundraiser'] : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_COURSES')
      ? ['learningHub', 'courses']
      : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_CITIZENSHIP') ? ['citizenship'] : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_AFFILIATE') ? ['affiliate'] : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_BLOG') ? ['blog'] : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_ROLES') ? ['roles'] : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_RESIDENCY') ? ['residency'] : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_REFERRAL') ? ['referral'] : []),
    ...(isEnvFlagOn('NEXT_PUBLIC_FEATURE_CARROTS') ? ['credit'] : []),
    ...(isWeb3Enabled ? ['airdrop', 'governance'] : []),
    // `token` (formerly `web3`) now also carries the financed-purchase terms,
    // which matter to any platform with a token sale, not just token bookings.
    ...(isWeb3Enabled || isWeb3BookingEnabled ? ['token'] : []),
  ];
};

/**
 * Whether the build-time half of a group's gate is satisfied. A group with no
 * env flag is always unlocked at this level.
 */
export const isConfigUnlockedByEnv = (slug: string): boolean => {
  const flag = FEATURE_FLAG_BY_CONFIG[slug];
  return flag ? isEnvFlagOn(flag) : true;
};
