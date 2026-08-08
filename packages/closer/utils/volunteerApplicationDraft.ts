import type { VolunteerInfo } from '../types/booking';
import type {
  VolunteerApplication,
  VolunteerApplicationStepId,
} from '../types/volunteerApplication';

/**
 * The application is filled in before a stay exists, so the draft lives in
 * localStorage until `POST /stays` is called. It carries health answers, which
 * must never be put in a URL or any other shared surface.
 */
export type VolunteerApplicationDraft = {
  volunteerInfo: VolunteerInfo;
  step: VolunteerApplicationStepId;
  savedAt: string;
};

const DRAFT_VERSION = 1;

const storageKey = (userId: string, bookingType: string) =>
  `closer:volunteer-application:v${DRAFT_VERSION}:${userId}:${bookingType}`;

export const emptyVolunteerApplication = (): VolunteerApplication => ({
  about: {
    fullName: '',
    nationality: '',
    ageRange: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    hasInsurance: '',
    hearAboutUs: '',
    hearAboutUsOther: '',
  },
  experience: {
    hasVolunteeredBefore: '',
    previousStay: '',
    hopingToGain: '',
    anticipatedChallenges: '',
    selfCarePractices: '',
  },
  health: {
    hasPhysicalConditions: '',
    physicalConditionsDetails: '',
    isTreatedForMentalHealth: '',
    mentalHealthDetails: '',
    takesMedication: '',
    medicationDetails: '',
    allergies: '',
  },
  agreement: {},
});

const hydrateApplication = (
  application: Partial<VolunteerApplication> | undefined,
): VolunteerApplication => {
  const empty = emptyVolunteerApplication();
  return {
    about: { ...empty.about, ...application?.about },
    experience: { ...empty.experience, ...application?.experience },
    health: { ...empty.health, ...application?.health },
    agreement: { ...empty.agreement, ...application?.agreement },
    ...(application?.review ? { review: application.review } : {}),
  };
};

export const readVolunteerApplicationDraft = (
  userId: string | undefined,
  bookingType: string | undefined,
): VolunteerApplicationDraft | null => {
  try {
    if (typeof window === 'undefined' || !userId || !bookingType) return null;
    const raw = window.localStorage.getItem(storageKey(userId, bookingType));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VolunteerApplicationDraft>;
    if (!parsed.volunteerInfo) return null;
    return {
      step: parsed.step || 'about',
      savedAt: parsed.savedAt || '',
      volunteerInfo: {
        bookingType: parsed.volunteerInfo.bookingType || 'volunteer',
        skills: parsed.volunteerInfo.skills || [],
        diet: parsed.volunteerInfo.diet || [],
        suggestions: parsed.volunteerInfo.suggestions || '',
        projectId: parsed.volunteerInfo.projectId || [],
        application: hydrateApplication(parsed.volunteerInfo.application),
      },
    };
  } catch {
    return null;
  }
};

export const writeVolunteerApplicationDraft = (
  userId: string | undefined,
  bookingType: string | undefined,
  draft: Omit<VolunteerApplicationDraft, 'savedAt'>,
): string | null => {
  try {
    if (typeof window === 'undefined' || !userId || !bookingType) return null;
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(
      storageKey(userId, bookingType),
      JSON.stringify({ ...draft, savedAt }),
    );
    return savedAt;
  } catch {
    return null;
  }
};

export const clearVolunteerApplicationDraft = (
  userId: string | undefined,
  bookingType: string | undefined,
) => {
  try {
    if (typeof window === 'undefined' || !userId || !bookingType) return;
    window.localStorage.removeItem(storageKey(userId, bookingType));
  } catch {}
};
