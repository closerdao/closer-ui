import { VOLUNTEER_AGREEMENT_VERSION } from '../../constants/volunteerApplication';
import type { VolunteerApplication } from '../../types/volunteerApplication';
import {
  buildVolunteerInfo,
  hasFlaggedHealthAnswers,
  isVolunteerApplicationComplete,
  pruneConditionalAnswers,
  validateVolunteerApplicationStep,
} from '../volunteerApplication.helpers';
import { emptyVolunteerApplication } from '../volunteerApplicationDraft';

const t = (key: string) => key;

const completeApplication = (): VolunteerApplication => ({
  about: {
    fullName: 'Ana Ferreira',
    nationality: 'PT',
    ageRange: '25-34',
    phone: '+351 900 000 000',
    emergencyContactName: 'Rui Ferreira',
    emergencyContactPhone: '+351 911 111 111',
    emergencyContactRelationship: 'Sibling',
    hasInsurance: 'yes',
    hearAboutUs: 'friend',
    hearAboutUsOther: '',
  },
  experience: {
    hasVolunteeredBefore: 'no',
    previousStay: '',
    hopingToGain: 'Learn about soil health.',
    anticipatedChallenges: 'Being off-grid.',
    selfCarePractices: 'Daily walks.',
  },
  health: {
    hasPhysicalConditions: 'no',
    physicalConditionsDetails: '',
    isTreatedForMentalHealth: 'no',
    mentalHealthDetails: '',
    takesMedication: 'no',
    medicationDetails: '',
    allergies: 'none',
    consentedAt: '2026-08-01T10:00:00.000Z',
  },
  agreement: {
    acceptedAt: '2026-08-01T10:05:00.000Z',
    version: VOLUNTEER_AGREEMENT_VERSION,
  },
});

describe('validateVolunteerApplicationStep', () => {
  it('flags every required field on an empty step 1', () => {
    const errors = validateVolunteerApplicationStep(
      'about',
      emptyVolunteerApplication(),
      t,
    );
    expect(Object.keys(errors).sort()).toEqual(
      [
        'ageRange',
        'emergencyContactName',
        'emergencyContactPhone',
        'emergencyContactRelationship',
        'fullName',
        'hasInsurance',
        'hearAboutUs',
        'nationality',
        'phone',
      ].sort(),
    );
  });

  it('rejects a malformed phone number', () => {
    const application = completeApplication();
    application.about.phone = 'call me';
    const errors = validateVolunteerApplicationStep('about', application, t);
    expect(errors.phone).toBe('volunteer_application_error_phone');
  });

  it('requires the free-text field when "how did you hear" is other', () => {
    const application = completeApplication();
    application.about.hearAboutUs = 'other';
    expect(
      validateVolunteerApplicationStep('about', application, t)
        .hearAboutUsOther,
    ).toBe('volunteer_application_error_required');
  });

  it('requires the conditional detail only when the parent answer is yes', () => {
    const application = completeApplication();
    expect(
      validateVolunteerApplicationStep('health', application, t),
    ).toEqual({});

    application.health.takesMedication = 'yes';
    expect(
      validateVolunteerApplicationStep('health', application, t)
        .medicationDetails,
    ).toBe('volunteer_application_error_required');

    application.health.medicationDetails = 'Inhaler';
    expect(
      validateVolunteerApplicationStep('health', application, t),
    ).toEqual({});
  });

  it('requires the separate health consent', () => {
    const application = completeApplication();
    application.health.consentedAt = undefined;
    expect(
      validateVolunteerApplicationStep('health', application, t).consentedAt,
    ).toBe('volunteer_application_error_health_consent');
  });

  it('requires the agreement checkbox', () => {
    const application = completeApplication();
    application.agreement = {};
    expect(
      validateVolunteerApplicationStep('agreement', application, t).acceptedAt,
    ).toBe('volunteer_application_error_agreement');
  });

  it('treats a fully filled application as complete', () => {
    expect(isVolunteerApplicationComplete(completeApplication(), t)).toBe(true);
    expect(isVolunteerApplicationComplete(emptyVolunteerApplication(), t)).toBe(
      false,
    );
  });
});

describe('pruneConditionalAnswers', () => {
  it('clears details when the parent answer flips back to no', () => {
    const application = completeApplication();
    application.health.takesMedication = 'no';
    application.health.medicationDetails = 'Inhaler';
    application.experience.hasVolunteeredBefore = 'no';
    application.experience.previousStay = 'spring 2025';

    const pruned = pruneConditionalAnswers(application);
    expect(pruned.health.medicationDetails).toBe('');
    expect(pruned.experience.previousStay).toBe('');
  });

  it('keeps details when the parent answer is yes', () => {
    const application = completeApplication();
    application.health.hasPhysicalConditions = 'yes';
    application.health.physicalConditionsDetails = 'Knee injury';
    expect(
      pruneConditionalAnswers(application).health.physicalConditionsDetails,
    ).toBe('Knee injury');
  });
});

describe('hasFlaggedHealthAnswers', () => {
  it('is false without an application or with all-no answers', () => {
    expect(hasFlaggedHealthAnswers(undefined)).toBe(false);
    expect(hasFlaggedHealthAnswers({ bookingType: 'volunteer' })).toBe(false);
    expect(
      hasFlaggedHealthAnswers({
        bookingType: 'volunteer',
        application: completeApplication(),
      }),
    ).toBe(false);
  });

  it('is true when any health question is answered yes', () => {
    const application = completeApplication();
    application.health.isTreatedForMentalHealth = 'yes';
    expect(
      hasFlaggedHealthAnswers({ bookingType: 'volunteer', application }),
    ).toBe(true);
  });
});

describe('buildVolunteerInfo', () => {
  it('always returns the complete object, since the server replaces it wholesale', () => {
    const info = buildVolunteerInfo({ bookingType: 'volunteer' });
    expect(info).toEqual({
      bookingType: 'volunteer',
      skills: [],
      diet: [],
      suggestions: '',
      projectId: [],
    });
  });

  it('stamps the agreement version and an initial review status', () => {
    const application = completeApplication();
    application.agreement.version = undefined;
    const info = buildVolunteerInfo({
      bookingType: 'volunteer',
      skills: ['carpentry'],
      diet: ['vegan'],
      suggestions: 'Soil workshop',
      application,
    });
    expect(info.application?.agreement.version).toBe(
      VOLUNTEER_AGREEMENT_VERSION,
    );
    expect(info.application?.review?.status).toBe('submitted');
    expect(info.skills).toEqual(['carpentry']);
  });
});
