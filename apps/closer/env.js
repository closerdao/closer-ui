import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const optionalUrl = z.string().url().optional();
const optionalString = z.string().optional();
const optionalBooleanString = z.enum(['true', 'false']).optional();

/**
 * The app slug is used to resolve build-time assets on disk — most notably
 * `packages/closer/generated/locales/<slug>/<locale>.json`. A capitalised or
 * otherwise mismatched value silently resolves to a directory that does not
 * exist, so it is constrained to the lowercase slug form here rather than
 * being accepted as a free-form string.
 */
const appSlug = z
  .string()
  .regex(
    /^[a-z0-9-]+$/,
    'NEXT_PUBLIC_APP_NAME must be a lowercase slug (e.g. "closer"), because it resolves a generated locales directory on disk.',
  )
  .optional()
  .default('closer');

export const closerAppEnvShape = {
  NEXT_PUBLIC_API_URL: optionalUrl.describe(
    'Closer platform API base URL. Also used at build time by sync-build-config.',
  ),
  NEXT_PUBLIC_PLATFORM_URL: optionalUrl.describe(
    'Canonical public URL for the deployed app. Used for sitemap and OG tags.',
  ),
  // NOTE: unlike apps/village-app, where NEXT_PUBLIC_PLATFORM is a legacy
  // canonical-URL fallback, in apps/closer it carries the platform slug
  // (e.g. "closer"). It is deliberately NOT validated as a URL here.
  NEXT_PUBLIC_PLATFORM: optionalString,
  NEXT_PUBLIC_APP_NAME: appSlug,
  NEXT_PUBLIC_PLATFORM_NAME: optionalString.default('Closer'),
  NEXT_PUBLIC_DEFAULT_TIMEZONE: optionalString.default('Europe/Lisbon'),
  NEXT_PUBLIC_CDN_URL: optionalUrl,

  // Payments
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL: optionalUrl,
  NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT: optionalString,
  NEXT_PUBLIC_CLOSER_IBAN: optionalString,

  // Integrations
  NEXT_PUBLIC_FIREBASE_CONFIG: optionalString,
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: optionalString,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalString,
  NEXT_PUBLIC_CLOUDFLARE_KEY: optionalString,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalString,
  NEXT_PUBLIC_DEBUG_EMAIL: optionalString,

  // Web3
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: optionalString,
  NEXT_PUBLIC_NETWORK: optionalString,
  NEXT_PUBLIC_BOOK_ACCOMMODATION_GAS_LIMIT: optionalString,
  NEXT_PUBLIC_LIFI_INTEGRATOR: optionalString,

  // Behaviour
  NEXT_PUBLIC_REGISTRATION_MODE: optionalString,

  // Feature flags — defaults mirror apps/closer's current .env.local so a
  // missing variable never silently flips a feature on.
  NEXT_PUBLIC_FEATURE_AFFILIATE: optionalBooleanString.default('true'),
  NEXT_PUBLIC_FEATURE_BLOG: optionalBooleanString.default('true'),
  NEXT_PUBLIC_FEATURE_BOOKING: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_CARROTS: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_CITIZENSHIP: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_COURSES: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_LOCALE_SWITCH: optionalBooleanString.default('true'),
  NEXT_PUBLIC_FEATURE_REFERRAL: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_ROLES: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_SIGNUP_SUBSCRIBE: optionalBooleanString.default('true'),
  NEXT_PUBLIC_FEATURE_STABLECOIN_BOOKING:
    optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_SUPPORT_US: optionalBooleanString.default('true'),
  NEXT_PUBLIC_FEATURE_TOKEN_SALE: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_TOKEN_SALE_MULTI_CURRENCY:
    optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_VOLUNTEERING: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_WEB3_BOOKING: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_WEB3_WALLET: optionalBooleanString.default('false'),
};

export const closerAppEnvSchema = z.object(closerAppEnvShape);

export const requiredProvisioningEnvKeys = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_PLATFORM_URL',
];

export const env = createEnv({
  client: closerAppEnvShape,
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const appConfigFromEnv = {
  APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  DEFAULT_TIMEZONE: env.NEXT_PUBLIC_DEFAULT_TIMEZONE,
  STRIPE_CUSTOMER_PORTAL_URL: env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
};

export const platformUrl = env.NEXT_PUBLIC_PLATFORM_URL || '';

/** Platform slug (e.g. "closer"), not a URL. See the note on the shape above. */
export const platformSlug = env.NEXT_PUBLIC_PLATFORM || '';
