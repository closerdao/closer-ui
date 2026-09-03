/**
 * A lead is the GTM view over records that already exist elsewhere: a village
 * on the map, an application, a member. The nightly enrichment job builds it,
 * links it back to those records and writes the brief a GTM person reads before
 * a call. Nothing here is the source of truth — advancing a lead means writing
 * `village.onboardingStatus` or `application.status`, not this document.
 */

/** Which pipeline a lead sits in. Open set — the job can add more. */
export type LeadType = 'village' | 'member' | string;

/**
 * How far along the fit check is. `fund_eligible` is better than `fit`, and
 * `needs_info` means the questionnaire is not answered enough to decide.
 */
export type LeadFitVerdict =
  | 'fund_eligible'
  | 'fit'
  | 'needs_info'
  | 'not_fit'
  | string;

/** Where the enrichment job got to. `pending` is "never enriched". */
export type LeadEnrichmentStatus = 'pending' | 'enriched' | 'failed' | string;

/**
 * `fallback` means the deterministic path ran instead of the model — the brief
 * fills fewer fields and deserves a closer read before anyone acts on it.
 */
export type LeadAiProvider = 'anthropic' | 'fallback' | string;

/**
 * A single researched claim. The API drops facts it cannot attribute, so a fact
 * that reaches the client always carries the URL it came from.
 */
export interface LeadFact {
  label?: string;
  text?: string;
  sourceUrl?: string;
}

/** An AI-suggested answer to one fit question. A human confirms it before it is written. */
export interface LeadSuggestedCriterion {
  value?: unknown;
  confidence?: number;
  sourceUrl?: string;
}

export interface LeadEnrichment {
  summary?: string;
  facts?: LeadFact[];
  /** The questions to ask on the call — the highest-value block on the card. */
  openQuestions?: string[];
  suggestedCriteria?: Record<string, LeadSuggestedCriterion>;
}

/**
 * Facts about the person's journey, not a judgement of it. `score` and
 * `segment` are internal and are not surfaced to non-managers.
 */
export interface LeadSignals {
  journeyHighlights?: string[];
  nightsStayed?: number;
  totalSpent?: number;
  totalSpentCurrency?: string;
  opportunityCount?: number;
  score?: number;
  segment?: string;
}

/**
 * One line of the fit check, with the API's own reading of it ("8, below the
 * minimum of 10.", "Not answered yet.") so the UI never restates the rules.
 */
export interface LeadFitCheckLine {
  key?: string;
  label?: string;
  /** `hard` rules the project out on its own; anything else only weighs. */
  tier?: 'hard' | 'soft' | string;
  reason?: string;
  passed?: boolean;
}

/**
 * Why the verdict is what it is. `failing` are answers to change — someone
 * said no, or a number is under the bar; `unanswered` are questions still to
 * ask, which is never the project's fault.
 */
export interface LeadFitExplanation {
  headline?: string;
  detail?: string;
  failing?: LeadFitCheckLine[];
  unanswered?: LeadFitCheckLine[];
}

export interface LeadFitCheck {
  verdict?: LeadFitVerdict;
  reasons?: string[];
  checkedAt?: string;
  missing?: string[];
  checks?: LeadFitCheckLine[];
  explanation?: LeadFitExplanation;
}

export interface LeadAiMeta {
  provider?: LeadAiProvider;
  model?: string;
  searchCount?: number;
}

export interface LeadVillageRef {
  _id: string;
  name?: string;
  slug?: string;
  onboardingStatus?: string;
  visibility?: string;
  createdBy?: string;
  /** Kept off the map until the team, an ambassador or the creator publishes it. */
  isDraft?: boolean;
  /** When the owner invite went out, derived server-side from the private manager card. */
  ownerInvitedAt?: string | null;
  /** True once the invited person holds the village. */
  ownerClaimed?: boolean;
}

export interface LeadApplicationRef {
  _id: string;
  name?: string;
  email?: string;
  status?: string;
}

export interface LeadUserRef {
  _id: string;
  screenname?: string;
  email?: string;
}

export interface LeadOpportunityRef {
  _id: string;
  status?: string;
  subject?: string;
}

/**
 * The timeline the card renders and the audit trail for who moved what. Written
 * by the API, never by the client.
 */
/**
 * The four match criteria GTM answers by hand. `null` or missing is
 * unanswered; the API stores the verdict they add up to alongside them.
 */
export type LeadQualificationVerdict =
  | 'qualified'
  | 'not_qualified'
  | 'pending'
  | string;

export type LeadQualificationKey =
  | 'isVillage'
  | 'landOwned'
  | 'communityForming'
  | 'ecologicalAmbition';

export interface LeadQualification {
  isVillage?: boolean | null;
  landOwned?: boolean | null;
  communityForming?: boolean | null;
  ecologicalAmbition?: boolean | null;
  verdict?: LeadQualificationVerdict;
  answered?: number;
  total?: number;
  note?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

/** One CRM email that went out, as the API records it on the lead. */
export interface LeadSentEmail {
  template?: string;
  slug?: string;
  at?: string;
  by?: string | null;
}

export interface LeadActivityEntry {
  at?: string;
  by?: string;
  kind?: 'advanced' | 'contacted' | 'noted' | 'qualified' | string;
  from?: string;
  to?: string;
  channel?: string;
  note?: string;
}

export interface Lead {
  _id: string;
  email?: string;
  type?: LeadType;
  /** Derived from the linked records — `village_<onboardingStatus>` and such. */
  stage?: string;
  status?: LeadEnrichmentStatus;
  notes?: string;
  tags?: string[];
  /**
   * Who owns the lead. Stored as an array like every other `managedBy` in the
   * platform, but the UI only ever assigns one owner — read it through
   * `leadOwnerIds`.
   */
  managedBy?: string[] | string;
  nextActionAt?: string;
  lastContactedAt?: string;
  /** Markdown. The brief a GTM person reads before a call. */
  aiContext?: string;
  enrichment?: LeadEnrichment;
  signals?: LeadSignals;
  fit?: LeadFitCheck;
  qualification?: LeadQualification;
  aiMeta?: LeadAiMeta;
  emailsSent?: LeadSentEmail[];
  user?: LeadUserRef;
  villages?: LeadVillageRef[];
  applications?: LeadApplicationRef[];
  opportunities?: LeadOpportunityRef[];
  activity?: LeadActivityEntry[];
  created?: string;
  updated?: string;
  enrichedAt?: string;
}

/** Query the leads board takes. Every field is optional and dropped when empty. */
export interface LeadsBoardParams {
  type?: LeadType;
  status?: LeadEnrichmentStatus;
  verdict?: LeadFitVerdict;
  qualified?: LeadQualificationVerdict;
  q?: string;
  managedBy?: string;
  page?: number;
  limit?: number;
}

export interface LeadsBoardResponse {
  results?: Lead[];
  total?: number;
}

/** The subset of a lead the card edits. Everything else is read-only. */
export interface LeadDraftFields {
  notes: string;
  tags: string;
  nextActionAt: string;
}

/** One CRM email template, as `GET /leads/actions` describes it. */
export interface LeadEmailTemplate {
  key: string;
  slug?: string;
  name?: string;
  description?: string;
}

/**
 * The enums the board builds its controls from, so nothing is hard-coded on
 * the client. Every list is optional: an older API answers with fewer.
 */
export interface LeadQualificationQuestion {
  key: LeadQualificationKey | string;
  label?: string;
  help?: string;
}

export interface LeadActionsVocabulary {
  villageStatuses?: string[];
  applicationStatuses?: string[];
  contactChannels?: string[];
  sendActions?: string[];
  emailTemplates?: LeadEmailTemplate[];
  qualificationQuestions?: LeadQualificationQuestion[];
  qualificationVerdicts?: string[];
}

/** What `POST /leads/:id/contact` takes: a channel, and optionally a send. */
export interface LeadContactParams {
  channel: 'email' | 'call' | 'meeting' | 'other' | string;
  /** `invite_owner`, or one of the lead email templates. */
  send?: string;
  note?: string;
  message?: string;
  subject?: string;
}

export interface LeadContactResult {
  lead: Lead | null;
  channel?: string;
  sent?: Record<string, unknown> | null;
}

/** What a batch send takes. The GET preview and the POST send share it. */
export interface LeadEmailBatchParams {
  send: string;
  type?: LeadType;
  leadIds?: string[];
  applicantsOnly?: boolean;
  limit?: number;
  /** The sender's own words, plain text. Escaped server-side. */
  message?: string;
  /** Replaces the template's subject for this batch. */
  subject?: string;
  /** Preview only: which recipient's email to render. Never sent with the batch. */
  sampleId?: string;
}

export interface LeadEmailRecipient {
  leadId?: string;
  email?: string;
  status?: 'would_send' | 'sent' | 'skipped' | 'failed' | string;
  nextStep?: string;
  projectName?: string;
  reason?: string;
}

/** The email as one recipient would see it. `body` is HTML. */
export interface LeadEmailSample {
  leadId?: string;
  email?: string;
  subject?: string;
  title?: string;
  body?: string;
  ctaLink?: string;
  ctaText?: string;
  /** False when the instance has email switched off; a send would do nothing. */
  emailEnabled?: boolean;
}

export interface LeadEmailPreview {
  send?: string;
  template?: LeadEmailTemplate;
  candidates?: number;
  recipients?: LeadEmailRecipient[];
  sample?: LeadEmailSample | null;
}

export interface LeadEmailBatchResult {
  send?: string;
  candidates?: number;
  sent?: number;
  skipped?: number;
  failed?: number;
  results?: LeadEmailRecipient[];
}
