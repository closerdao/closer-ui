import type { VolunteerApplicationStepId } from '../types/volunteerApplication';

export const VOLUNTEER_APPLICATION_STEPS: VolunteerApplicationStepId[] = [
  'about',
  'experience',
  'health',
  'agreement',
];

export const VOLUNTEER_APPLICATION_STEP_TITLE_KEYS: Record<
  VolunteerApplicationStepId,
  string
> = {
  about: 'volunteer_application_step_about_title',
  experience: 'volunteer_application_step_experience_title',
  health: 'volunteer_application_step_health_title',
  agreement: 'volunteer_application_step_agreement_title',
};

/**
 * The full applicant funnel, used to size the progress bar: the four
 * application steps run before the existing accommodation and payment pages.
 */
export const VOLUNTEER_APPLICATION_FUNNEL_STEPS = [
  ...VOLUNTEER_APPLICATION_STEPS,
  'accomodation',
  'summary',
  'checkout',
];

export const VOLUNTEER_AGE_RANGES = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
];

export const VOLUNTEER_HEAR_ABOUT_US_OPTIONS = [
  { value: 'friend', labelKey: 'volunteer_application_hear_friend' },
  { value: 'instagram', labelKey: 'volunteer_application_hear_instagram' },
  { value: 'newsletter', labelKey: 'volunteer_application_hear_newsletter' },
  { value: 'previous-stay', labelKey: 'volunteer_application_hear_previous' },
  { value: 'platform', labelKey: 'volunteer_application_hear_platform' },
  { value: 'event', labelKey: 'volunteer_application_hear_event' },
  { value: 'press', labelKey: 'volunteer_application_hear_press' },
  { value: 'other', labelKey: 'volunteer_application_hear_other' },
];

/**
 * Bump when the agreement copy changes — the accepted version is stored on the
 * application record alongside the acceptance timestamp.
 */
export const VOLUNTEER_AGREEMENT_VERSION = '2026-08-06';

export const VOLUNTEER_AGREEMENT_CLAUSE_KEYS = [
  'volunteer_application_agreement_clause_1',
  'volunteer_application_agreement_clause_2',
  'volunteer_application_agreement_clause_3',
  'volunteer_application_agreement_clause_4',
  'volunteer_application_agreement_clause_5',
];

/** Retention window for the health section, surfaced in the consent copy. */
export const VOLUNTEER_HEALTH_RETENTION_DAYS = 90;
