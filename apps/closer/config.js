import { z } from 'zod';

const optionalUrl = z.string().url().optional().or(z.literal(''));
const optionalEmail = z.string().email().optional().or(z.literal(''));

export const closerGeneralConfigSchema = z.object({
  platformName: z.string().default('Closer'),
  appName: z.string().default('closer'),
  semanticUrl: optionalUrl.default(''),
  teamEmail: optionalEmail.default(''),
  timeZone: z.string().default('Europe/Lisbon'),
  logoHeader: z.string().optional(),
  facebookUrl: optionalUrl.default(''),
  instagramUrl: optionalUrl.default(''),
  telegramUrl: optionalUrl.default(''),
  twitterUrl: optionalUrl.default(''),
  primaryCtaVisitor: z.string().default('login'),
  primaryCtaMember: z.string().default('bookings'),
  primaryCtaCustomUrl: optionalUrl.default(''),
  primaryCtaCustomText: z.string().default(''),
});

export const closerHomepageConfigSchema = z.object({
  slug: z.literal('/').default('/'),
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: optionalUrl.optional(),
  sections: z.array(z.unknown()).default([]),
});

export const closerRuntimeConfigSchema = z.object({
  general: closerGeneralConfigSchema.default({}),
  homepage: closerHomepageConfigSchema.optional(),
  booking: z.record(z.unknown()).optional(),
  payment: z.record(z.unknown()).optional(),
  citizenship: z.record(z.unknown()).optional(),
  subscriptions: z.record(z.unknown()).optional(),
  events: z.record(z.unknown()).optional(),
  blog: z.record(z.unknown()).optional(),
  learningHub: z.record(z.unknown()).optional(),
  volunteering: z.record(z.unknown()).optional(),
  governance: z.record(z.unknown()).optional(),
  rbac: z.record(z.unknown()).optional(),

  // Config slugs that apps/closer consumes beyond the village baseline.
  affiliate: z.record(z.unknown()).optional(),
  fundraiser: z.record(z.unknown()).optional(),
  referral: z.record(z.unknown()).optional(),
  roles: z.record(z.unknown()).optional(),
});

export const requiredRuntimeConfigKeys = ['general'];

export const optionalRuntimeConfigKeys = [
  'homepage',
  'booking',
  'payment',
  'citizenship',
  'subscriptions',
  'events',
  'blog',
  'learningHub',
  'volunteering',
  'governance',
  'rbac',
  'affiliate',
  'fundraiser',
  'referral',
  'roles',
];

export const closerConfigDefaults = closerRuntimeConfigSchema.parse({});
