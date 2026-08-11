export const VILLAGE_COLLECTION = 'village';

export const VILLAGE_STATUSES = [
  'planning',
  'active',
  'paused',
  'completed',
  'cancelled',
] as const;

export const VILLAGE_VERIFICATION_BADGES = [
  'unverified',
  'pending',
  'verified',
  'resonant',
] as const;

export const VILLAGE_ONBOARDING_STATUSES = [
  'map_only',
  'pre_assessed',
  'subscribed',
  'deploy_requested',
  'deploying',
  'live',
  'intro_scheduled',
] as const;

export const PLATFORM_SUBSCRIPTION_PRICE_EUR = 49;
export const PLATFORM_SETUP_FEE_EUR = 0;
export const TIER2_SETUP_FEE_EUR = 5000;

export const HARD_CRITERIA_FIELDS = [
  'landBased',
  'hasLand',
  'peopleOnLand',
  'operationalized',
  'notTechnophobic',
] as const;

export const PEOPLE_COUNT_MIN = 10;
export const PEOPLE_COUNT_MAX = 500;
export const ROOMS_COUNT_MIN = 10;
export const MONTHLY_VOLUME_SOFT_MIN = 5000;
export const MONTHLY_VOLUME_SOFT_MAX = 20000;

export const AMBASSADOR_ROLE = 'ambassador';

/**
 * Roles allowed to see the internal parts of the village form — the fit
 * checklist and the project manager card. Village owners edit their listing
 * without either.
 */
export const VILLAGE_REVIEWER_ROLES = ['team', 'admin', AMBASSADOR_ROLE];
