/**
 * Resolves which platform features are live, so dashboard blocks and stat tiles
 * can be rendered from configuration instead of being hardcoded per app.
 *
 * A feature is on when its platform config says so AND, where one exists, its
 * build-time env flag agrees. This mirrors what `DashboardNav` already does for
 * navigation links.
 */
import { getPaidSubscriptionPlans } from '../../utils/subscriptions.helpers';

export interface DashboardFeatures {
  isBookingEnabled: boolean;
  isSubscriptionsEnabled: boolean;
  isEventsEnabled: boolean;
  isVolunteeringEnabled: boolean;
  isCitizenshipEnabled: boolean;
  isTokenSaleEnabled: boolean;
  isWeb3Enabled: boolean;
  isAffiliateEnabled: boolean;
  isGovernanceEnabled: boolean;
  isApplicationsEnabled: boolean;
  isFundraiserEnabled: boolean;
  isLearningHubEnabled: boolean;
  isPaymentEnabled: boolean;
}

/**
 * Env flags are inlined by Next at build time, so every `process.env.X` has to
 * be spelled out literally — a computed lookup resolves to undefined in the
 * browser bundle. Tests pass their own object instead.
 */
export interface DashboardEnvFlags {
  booking?: string;
  subscriptions?: string;
  volunteering?: string;
  citizenship?: string;
  tokenSale?: string;
  web3Wallet?: string;
  affiliate?: string;
  courses?: string;
}

export const readDashboardEnvFlags = (): DashboardEnvFlags => ({
  booking: process.env.NEXT_PUBLIC_FEATURE_BOOKING,
  subscriptions: process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS,
  volunteering: process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING,
  citizenship: process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP,
  tokenSale: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE,
  web3Wallet: process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET,
  affiliate: process.env.NEXT_PUBLIC_FEATURE_AFFILIATE,
  courses: process.env.NEXT_PUBLIC_FEATURE_COURSES,
});

const isConfigEnabled = (config: any, slug: string): boolean =>
  config?.[slug]?.enabled === true;

const isEnvEnabled = (flag: string | undefined): boolean => flag === 'true';

export const resolveDashboardFeatures = (
  config: any,
  env: DashboardEnvFlags = readDashboardEnvFlags(),
): DashboardFeatures => ({
  isBookingEnabled: isConfigEnabled(config, 'booking') && isEnvEnabled(env.booking),
  isSubscriptionsEnabled:
    isConfigEnabled(config, 'subscriptions') && isEnvEnabled(env.subscriptions),
  isVolunteeringEnabled:
    isConfigEnabled(config, 'volunteering') && isEnvEnabled(env.volunteering),
  isCitizenshipEnabled:
    isConfigEnabled(config, 'citizenship') && isEnvEnabled(env.citizenship),
  isAffiliateEnabled:
    isConfigEnabled(config, 'affiliate') && isEnvEnabled(env.affiliate),
  isLearningHubEnabled:
    isConfigEnabled(config, 'learningHub') && isEnvEnabled(env.courses),

  // No config slug of their own — the env flag is the only switch.
  isTokenSaleEnabled: isEnvEnabled(env.tokenSale),
  isWeb3Enabled: isEnvEnabled(env.web3Wallet),

  // Config-only features.
  isEventsEnabled: isConfigEnabled(config, 'events'),
  isGovernanceEnabled: isConfigEnabled(config, 'governance'),
  isApplicationsEnabled: isConfigEnabled(config, 'applications'),
  isFundraiserEnabled: isConfigEnabled(config, 'fundraiser'),
  isPaymentEnabled: isConfigEnabled(config, 'payment'),
});

/**
 * Paid subscription plans, in config order. The subscriptions donut used to
 * hardcode TDF's `wanderer` / `pioneer`, which renders empty tiers on every
 * other app.
 */
export const getDashboardSubscriptionPlans = (
  config: any,
): { slug: string; title: string }[] =>
  getPaidSubscriptionPlans(config?.subscriptions, { availableOnly: false })
    .filter((plan) => typeof plan?.slug === 'string' && plan.slug.length > 0)
    .map((plan) => ({ slug: plan.slug, title: plan.title || plan.slug }));
