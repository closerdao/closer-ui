import { z } from 'zod';

const optionalUrl = z.string().url().optional().or(z.literal(''));
const optionalEmail = z.string().email().optional().or(z.literal(''));

/**
 * Display form of the provisioning slug: "sunset-valley" → "Sunset Valley".
 * Display only — the raw slug keeps its discriminator/locale-key role.
 */
export const humanizeVillageSlug = (slug) =>
  String(slug ?? '')
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Day-one display name: the humanized provisioning slug (NEXT_PUBLIC_APP_NAME
 * is required at build time). The real name wins once general.platformName is
 * seeded. 'This village' survives only as a last-resort guard for builds that
 * somehow pass an empty slug.
 */
const dayOneVillageName =
  humanizeVillageSlug(process.env.NEXT_PUBLIC_APP_NAME) || 'This village';

export const villageGeneralConfigSchema = z.object({
  platformName: z.string().default(dayOneVillageName),
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

export const villageHomepageConfigSchema = z.object({
  slug: z.literal('/').default('/'),
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: optionalUrl.optional(),
  sections: z.array(z.unknown()).default([]),
});

export const villageRuntimeConfigSchema = z.object({
  general: villageGeneralConfigSchema.default({}),
  homepage: villageHomepageConfigSchema.optional(),
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
];

export const defaultedRuntimeConfigKeys = [
  'general.platformName',
  'general.appName',
  'general.semanticUrl',
  'general.teamEmail',
  'general.timeZone',
  'general.facebookUrl',
  'general.instagramUrl',
  'general.telegramUrl',
  'general.twitterUrl',
  'general.primaryCtaVisitor',
  'general.primaryCtaMember',
  'general.primaryCtaCustomUrl',
  'general.primaryCtaCustomText',
  'homepage.slug',
  'homepage.sections',
];

export const villageConfigDefaults = villageRuntimeConfigSchema.parse({});
