export const VILLAGE_COLLECTION = 'village';
export const LAND_PROJECT_COLLECTION = VILLAGE_COLLECTION;
export const PROJECT_API_COLLECTION = 'projectapi';

export const LAND_PROJECT_STATUSES = [
  'planning',
  'active',
  'paused',
  'completed',
  'cancelled',
] as const;

export const LAND_PROJECT_VERIFICATION_BADGES = [
  'unverified',
  'pending',
  'verified',
  'resonant',
] as const;

export const LAND_PROJECT_ONBOARDING_STATUSES = [
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
