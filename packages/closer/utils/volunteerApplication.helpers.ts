import {
  VOLUNTEER_AGREEMENT_VERSION,
  VOLUNTEER_APPLICATION_STEPS,
} from '../constants/volunteerApplication';
import type { VolunteerInfo } from '../types/booking';
import type {
  VolunteerApplication,
  VolunteerApplicationStepId,
} from '../types/volunteerApplication';

export type VolunteerApplicationErrors = Record<string, string>;

const isBlank = (value: string | undefined | null) =>
  !value || !value.trim();

/** Lenient international format check — the server does not validate these. */
const isPhoneish = (value: string) =>
  /^\+?[\d\s().-]{7,20}$/.test(value.trim());

export const validateVolunteerApplicationStep = (
  step: VolunteerApplicationStepId,
  application: VolunteerApplication,
  t: (key: string) => string,
): VolunteerApplicationErrors => {
  const errors: VolunteerApplicationErrors = {};
  const required = t('volunteer_application_error_required');

  if (step === 'about') {
    const about = application.about;
    if (isBlank(about.fullName)) errors.fullName = required;
    if (isBlank(about.nationality)) errors.nationality = required;
    if (isBlank(about.ageRange)) errors.ageRange = required;
    if (isBlank(about.phone)) errors.phone = required;
    else if (!isPhoneish(about.phone))
      errors.phone = t('volunteer_application_error_phone');
    if (isBlank(about.emergencyContactName))
      errors.emergencyContactName = required;
    if (isBlank(about.emergencyContactPhone))
      errors.emergencyContactPhone = required;
    else if (!isPhoneish(about.emergencyContactPhone))
      errors.emergencyContactPhone = t('volunteer_application_error_phone');
    if (isBlank(about.emergencyContactRelationship))
      errors.emergencyContactRelationship = required;
    if (isBlank(about.hasInsurance)) errors.hasInsurance = required;
    if (isBlank(about.hearAboutUs)) errors.hearAboutUs = required;
    else if (about.hearAboutUs === 'other' && isBlank(about.hearAboutUsOther))
      errors.hearAboutUsOther = required;
  }

  if (step === 'experience') {
    const experience = application.experience;
    if (isBlank(experience.hasVolunteeredBefore))
      errors.hasVolunteeredBefore = required;
    else if (
      experience.hasVolunteeredBefore === 'yes' &&
      isBlank(experience.previousStay)
    )
      errors.previousStay = required;
    if (isBlank(experience.hopingToGain)) errors.hopingToGain = required;
    if (isBlank(experience.anticipatedChallenges))
      errors.anticipatedChallenges = required;
    if (isBlank(experience.selfCarePractices))
      errors.selfCarePractices = required;
  }

  if (step === 'health') {
    const health = application.health;
    if (isBlank(health.hasPhysicalConditions))
      errors.hasPhysicalConditions = required;
    else if (
      health.hasPhysicalConditions === 'yes' &&
      isBlank(health.physicalConditionsDetails)
    )
      errors.physicalConditionsDetails = required;
    if (isBlank(health.isTreatedForMentalHealth))
      errors.isTreatedForMentalHealth = required;
    else if (
      health.isTreatedForMentalHealth === 'yes' &&
      isBlank(health.mentalHealthDetails)
    )
      errors.mentalHealthDetails = required;
    if (isBlank(health.takesMedication)) errors.takesMedication = required;
    else if (health.takesMedication === 'yes' && isBlank(health.medicationDetails))
      errors.medicationDetails = required;
    if (isBlank(health.allergies)) errors.allergies = required;
    if (!health.consentedAt)
      errors.consentedAt = t('volunteer_application_error_health_consent');
  }

  if (step === 'agreement') {
    if (!application.agreement.acceptedAt)
      errors.acceptedAt = t('volunteer_application_error_agreement');
  }

  return errors;
};

export const isVolunteerApplicationComplete = (
  application: VolunteerApplication,
  t: (key: string) => string,
): boolean =>
  VOLUNTEER_APPLICATION_STEPS.every(
    (step) =>
      Object.keys(validateVolunteerApplicationStep(step, application, t))
        .length === 0,
  );

/**
 * Conditional details are cleared when the parent answer flips back to "no" so
 * a stale disclosure never reaches the host.
 */
export const pruneConditionalAnswers = (
  application: VolunteerApplication,
): VolunteerApplication => ({
  ...application,
  experience: {
    ...application.experience,
    previousStay:
      application.experience.hasVolunteeredBefore === 'yes'
        ? application.experience.previousStay
        : '',
  },
  health: {
    ...application.health,
    physicalConditionsDetails:
      application.health.hasPhysicalConditions === 'yes'
        ? application.health.physicalConditionsDetails
        : '',
    mentalHealthDetails:
      application.health.isTreatedForMentalHealth === 'yes'
        ? application.health.mentalHealthDetails
        : '',
    medicationDetails:
      application.health.takesMedication === 'yes'
        ? application.health.medicationDetails
        : '',
  },
});

/**
 * True when any health question was answered "yes" — drives the "read this one
 * carefully" flag on the host list view. It is not a rejection signal.
 */
export const hasFlaggedHealthAnswers = (
  volunteerInfo: VolunteerInfo | undefined | null,
): boolean => {
  const health = volunteerInfo?.application?.health;
  if (!health) return false;
  return (
    health.hasPhysicalConditions === 'yes' ||
    health.isTreatedForMentalHealth === 'yes' ||
    health.takesMedication === 'yes'
  );
};

/**
 * Builds the `volunteerInfo` sent to `POST /stays` / `PATCH /stays/:id/options`.
 * volunteerInfo is replaced wholesale by the server, so this always returns the
 * complete object.
 */
export const buildVolunteerInfo = ({
  bookingType,
  skills,
  diet,
  suggestions,
  projectId,
  application,
}: {
  bookingType: 'volunteer' | 'residence';
  skills?: string[];
  diet?: string[];
  suggestions?: string;
  projectId?: string[];
  application?: VolunteerApplication | null;
}): VolunteerInfo => ({
  bookingType,
  skills: skills || [],
  diet: diet || [],
  suggestions: suggestions || '',
  projectId: projectId || [],
  ...(application
    ? {
        application: {
          ...application,
          agreement: {
            ...application.agreement,
            version: application.agreement.version || VOLUNTEER_AGREEMENT_VERSION,
          },
          review: application.review || { status: 'submitted' },
        },
      }
    : {}),
});
