import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const optionalUrl = z.string().url().optional();
const optionalString = z.string().optional();
const optionalBooleanString = z.enum(['true', 'false']).optional();

export const villageAppEnvShape = {
  NEXT_PUBLIC_API_URL: optionalUrl.describe(
    'Required for a connected Village Deployment. Optional only for local or empty Coming Soon smoke tests.',
  ),
  NEXT_PUBLIC_PLATFORM_URL: optionalUrl.describe(
    'Canonical public URL for the deployed village app.',
  ),
  NEXT_PUBLIC_PLATFORM: optionalUrl.describe(
    'Legacy canonical public URL fallback.',
  ),
  NEXT_PUBLIC_APP_NAME: optionalString.default('closer'),
  NEXT_PUBLIC_PLATFORM_NAME: optionalString.default('This village'),
  NEXT_PUBLIC_DEFAULT_TIMEZONE: optionalString.default('Europe/Lisbon'),
  NEXT_PUBLIC_CDN_URL: optionalUrl,
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL: optionalUrl,
  NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT: optionalString,
  NEXT_PUBLIC_FIREBASE_CONFIG: optionalString,
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: optionalString,
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: optionalString,
  NEXT_PUBLIC_NETWORK: optionalString,
  NEXT_PUBLIC_FEATURE_AFFILIATE: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_BLOG: optionalBooleanString.default('true'),
  NEXT_PUBLIC_FEATURE_BOOKING: optionalBooleanString.default('true'),
  NEXT_PUBLIC_FEATURE_CARROTS: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_CITIZENSHIP: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_COURSES: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_LOCALE_SWITCH: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_ROLES: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_SIGNUP_SUBSCRIBE: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_SUPPORT_US: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_TOKEN_SALE: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_VOLUNTEERING: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_WEB3_BOOKING: optionalBooleanString.default('false'),
  NEXT_PUBLIC_FEATURE_WEB3_WALLET: optionalBooleanString.default('false'),
};

export const villageAppEnvSchema = z.object(villageAppEnvShape);

export const requiredProvisioningEnvKeys = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_PLATFORM_URL',
];

export const optionalProvisioningEnvKeys = [
  'NEXT_PUBLIC_CDN_URL',
  'NEXT_PUBLIC_FIREBASE_CONFIG',
  'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
  'NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY',
  'NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT',
  'NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL',
  'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
];

export const defaultedProvisioningEnvKeys = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_DEFAULT_TIMEZONE',
  'NEXT_PUBLIC_PLATFORM_NAME',
  'NEXT_PUBLIC_FEATURE_AFFILIATE',
  'NEXT_PUBLIC_FEATURE_BLOG',
  'NEXT_PUBLIC_FEATURE_BOOKING',
  'NEXT_PUBLIC_FEATURE_CARROTS',
  'NEXT_PUBLIC_FEATURE_CITIZENSHIP',
  'NEXT_PUBLIC_FEATURE_COURSES',
  'NEXT_PUBLIC_FEATURE_LOCALE_SWITCH',
  'NEXT_PUBLIC_FEATURE_ROLES',
  'NEXT_PUBLIC_FEATURE_SIGNUP_SUBSCRIBE',
  'NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS',
  'NEXT_PUBLIC_FEATURE_SUPPORT_US',
  'NEXT_PUBLIC_FEATURE_TOKEN_SALE',
  'NEXT_PUBLIC_FEATURE_VOLUNTEERING',
  'NEXT_PUBLIC_FEATURE_WEB3_BOOKING',
  'NEXT_PUBLIC_FEATURE_WEB3_WALLET',
];

export const env = createEnv({
  client: villageAppEnvShape,
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const appConfigFromEnv = {
  APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  DEFAULT_TIMEZONE: env.NEXT_PUBLIC_DEFAULT_TIMEZONE,
  STRIPE_CUSTOMER_PORTAL_URL: env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
};

export const platformUrl =
  env.NEXT_PUBLIC_PLATFORM_URL || env.NEXT_PUBLIC_PLATFORM || '';
