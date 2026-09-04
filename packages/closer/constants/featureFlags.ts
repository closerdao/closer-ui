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

/**
 * Every env flag this module knows about, read through a *static*
 * `process.env.NEXT_PUBLIC_…` expression.
 *
 * This shape is not stylistic. Next.js inlines `NEXT_PUBLIC_*` vars into the
 * client bundle with webpack's DefinePlugin, which only substitutes literal
 * member expressions — `process.env.NEXT_PUBLIC_FEATURE_BOOKING`. A computed
 * read (`process.env[name]`) is left alone, and in the browser `process` is a
 * polyfill whose `env` is `{}`, so every computed read comes back `undefined`.
 * The server render saw the real values and the client re-render saw none, so
 * every env-gated group collapsed into "Additional features" the moment the
 * page hydrated. Keep the reads literal.
 *
 * Rebuilt on each call rather than frozen at module load: the test suite sets
 * `process.env.NEXT_PUBLIC_FEATURE_*` per case, and under Jest these reads are
 * genuine `process.env` lookups.
 */
const readEnvFlags = (): Record<string, boolean> => ({
  NEXT_PUBLIC_FEATURE_BOOKING:
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
  NEXT_PUBLIC_FEATURE_VOLUNTEERING:
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true',
  NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS:
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true',
  NEXT_PUBLIC_FEATURE_SUPPORT_US:
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true',
  NEXT_PUBLIC_FEATURE_COURSES:
    process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true',
  NEXT_PUBLIC_FEATURE_CITIZENSHIP:
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true',
  NEXT_PUBLIC_FEATURE_AFFILIATE:
    process.env.NEXT_PUBLIC_FEATURE_AFFILIATE === 'true',
  NEXT_PUBLIC_FEATURE_BLOG: process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true',
  NEXT_PUBLIC_FEATURE_ROLES: process.env.NEXT_PUBLIC_FEATURE_ROLES === 'true',
  NEXT_PUBLIC_FEATURE_RESIDENCY:
    process.env.NEXT_PUBLIC_FEATURE_RESIDENCY === 'true',
  NEXT_PUBLIC_FEATURE_REFERRAL:
    process.env.NEXT_PUBLIC_FEATURE_REFERRAL === 'true',
  NEXT_PUBLIC_FEATURE_WEB3_WALLET:
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true',
  NEXT_PUBLIC_FEATURE_WEB3_BOOKING:
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true',
});

const isEnvFlagOn = (name: string): boolean => readEnvFlags()[name] === true;

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
