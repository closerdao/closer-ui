export type YesNo = 'yes' | 'no';

export type VolunteerApplicationAbout = {
  fullName: string;
  nationality: string;
  ageRange: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  hasInsurance: YesNo | '';
  hearAboutUs: string;
  hearAboutUsOther: string;
};

export type VolunteerApplicationExperience = {
  hasVolunteeredBefore: YesNo | '';
  previousStay: string;
  hopingToGain: string;
  anticipatedChallenges: string;
  selfCarePractices: string;
};

export type VolunteerApplicationHealth = {
  hasPhysicalConditions: YesNo | '';
  physicalConditionsDetails: string;
  isTreatedForMentalHealth: YesNo | '';
  mentalHealthDetails: string;
  takesMedication: YesNo | '';
  medicationDetails: string;
  allergies: string;
  /** GDPR Art. 9 explicit, unbundled consent — ISO timestamp when granted. */
  consentedAt?: string;
};

export type VolunteerApplicationAgreement = {
  acceptedAt?: string;
  version?: string;
};

/**
 * Host-side review state. `status` extends the stay status flow with the
 * "call requested" step, which has no equivalent stay status.
 */
export type VolunteerApplicationReview = {
  status?: 'submitted' | 'call-requested' | 'accepted' | 'declined';
  callRequestedAt?: string;
  callRequestMessage?: string;
  decidedAt?: string;
  declineReason?: string;
};

export type VolunteerApplication = {
  about: VolunteerApplicationAbout;
  experience: VolunteerApplicationExperience;
  health: VolunteerApplicationHealth;
  agreement: VolunteerApplicationAgreement;
  review?: VolunteerApplicationReview;
};

export type VolunteerApplicationStepId =
  | 'about'
  | 'experience'
  | 'health'
  | 'agreement';
