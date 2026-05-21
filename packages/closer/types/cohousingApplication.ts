import type { User } from 'closer/contexts/auth/types';

export interface CohousingInvitation {
  issued?: boolean;
  issuedAt?: string;
  issuedBy?: string;
  note?: string;
}

export interface QuizAttempt {
  startedAt?: string;
  completedAt?: string;
  score?: number;
  total?: number;
  answers?: number[] | Record<string, string>;
  passed?: boolean;
}

export interface CohousingQuiz {
  attempts?: QuizAttempt[];
  passed?: boolean;
  passedAt?: string;
  score?: number;
  answers?: number[] | Record<string, string>;
}

export interface CohousingCosigner {
  mode?: 'solo' | 'duo' | string;
  invitedAt?: string;
  invitedEmail?: string;
  invitedName?: string;
  acceptedAt?: string;
  userId?: string;
  quizPassedAt?: string;
  letterSignedAt?: string;
}

export interface CohousingReadiness {
  [key: string]: unknown;
}

export interface LoanTerms {
  amount?: number;
  rate?: number;
  termYears?: number;
  currency?: string;
}

export interface CommitmentLetter {
  previewedAt?: string;
  signature?: string;
  location?: string;
  locationSource?: string;
  signedAt?: string;
  mailedAt?: string;
  receivedAt?: string;
  receivedBy?: string;
  countersignedAt?: string;
  countersignedBy?: string;
  documentRef?: string;
}

export interface CohousingUnit {
  ref?: string;
  type?: string;
  size?: number;
  reservedAt?: string;
  releasedAt?: string;
}

export interface FundsTransfer {
  wiredAt?: string;
  wiredAmount?: number;
  wireReference?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  certificateRef?: string;
}

export interface CitizenshipAttestation {
  attestedAt?: string;
  attestedBy?: string;
  tokensSnapshot?: unknown;
  vouchesSnapshot?: unknown;
  isCitizen?: boolean;
  waived?: boolean;
  waivedBy?: string;
  waivedReason?: string;
}

export interface CultureEvent {
  eventId?: string;
  title?: string;
  at?: string;
  attended?: boolean;
  excused?: boolean;
}

export interface CultureParticipation {
  events?: CultureEvent[];
  attendedCount?: number;
  requiredCount?: number;
  lastAttendedAt?: string;
  inGoodStanding?: boolean;
}

export interface DesignLock {
  plansReleasedAt?: string;
  houseValue?: number;
  tenPercentDue?: number;
  tenPercentPaidAt?: string;
  decision?: string;
  decisionAt?: string;
  tokensIssued?: number;
  conversionTxRef?: string;
  convertedAt?: string;
  dropoutReason?: string;
  loanRepaymentScheduledBy?: string;
  loanRepaidAt?: string;
  replacementFoundAt?: string;
}

export interface StagePaymentSlice {
  pct?: number;
  dueAmount?: number;
  dueAt?: string;
  wiredAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  coveredByMortgage?: boolean;
  tokensIssued?: number;
  conversionTxRef?: string;
}

export interface StagePayments {
  start?: StagePaymentSlice;
  halfway?: StagePaymentSlice;
  complete?: StagePaymentSlice;
}

export interface OverrunLine {
  at?: string;
  amount?: number;
  reason?: string;
  paidAt?: string;
}

export interface ConstructionPricing {
  baseRatePerM2?: number;
  commonsBudgetPct?: number;
  commonsMinimum?: number;
  contingencyPct?: number;
  finalConstructionCost?: number;
  finalCommonsBudget?: number;
  finalTotal?: number;
  overrunsBilled?: OverrunLine[];
}

export interface Licensing {
  filedAt?: string;
  municipality?: string;
  pipRef?: string;
  inspectedAt?: string;
  issuedAt?: string;
  licenceRef?: string;
  teamOwner?: string;
}

export interface Keys {
  transferredAt?: string;
  transferredBy?: string;
  utilitiesStartedAt?: string;
  exitLockUntil?: string;
  checkoutInspectionAt?: string;
  tokensLiquidAt?: string;
}

export interface Ongoing {
  commonsFeeMonthly?: number;
  presenceMonthsPer2Years?: number;
  contributionHoursPerWeek?: number;
  shortLetRevenueSplit?: string;
}

export interface CohousingFlag {
  raised?: boolean;
  reason?: string;
  raisedAt?: string;
  raisedBy?: string;
  clearedAt?: string;
  clearedBy?: string;
}

export interface TeamNote {
  at?: string;
  by?: string;
  text?: string;
}

export interface StepHistoryEntry {
  step?: number;
  event?: string;
  at?: string;
  by?: string;
  payload?: unknown;
}

export interface CohousingIntake {
  fullName?: string;
  email?: string;
  preferredNeighborhood?: string;
  householdSize?: string;
  motivation?: string;
}

export interface CohousingApplication {
  _id: string;
  createdBy?: string | User;
  created?: string;
  updated?: string;
  isDraft?: boolean;
  currentStep?: number;
  cohort?: string;
  source?: string | Record<string, unknown>;
  intake?: CohousingIntake;
  queuedAt?: string;
  status?: string;
  statusReason?: string;
  invitation?: CohousingInvitation;
  quiz?: CohousingQuiz;
  cosigner?: CohousingCosigner;
  readiness?: CohousingReadiness;
  financingMode?: string;
  financingModeChosenAt?: string;
  financingDocumentsAcknowledged?: boolean;
  financingDocumentsAcknowledgedAt?: string;
  tier?: string;
  reservationLoan?: LoanTerms;
  topupLoan?: LoanTerms;
  commitmentLetter?: CommitmentLetter;
  unit?: CohousingUnit;
  fundsTransfer?: FundsTransfer;
  citizenshipAttestation?: CitizenshipAttestation;
  cultureParticipation?: CultureParticipation;
  designLock?: DesignLock;
  stagePayments?: StagePayments;
  constructionPricing?: ConstructionPricing;
  licensing?: Licensing;
  keys?: Keys;
  ongoing?: Ongoing;
  lastCheckinAt?: string;
  flag?: CohousingFlag;
  teamNotes?: TeamNote[];
  stepHistory?: StepHistoryEntry[];
}
