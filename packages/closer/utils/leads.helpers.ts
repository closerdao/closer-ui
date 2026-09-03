import dayjs from 'dayjs';

import { User } from '../contexts/auth/types';
import {
  Lead,
  LeadDraftFields,
  LeadEmailTemplate,
  LeadFact,
  LeadFitCheck,
  LeadFitExplanation,
  LeadFitVerdict,
  LeadQualificationKey,
  LeadQualificationVerdict,
  LeadType,
  LeadVillageRef,
  LeadsBoardParams,
} from '../types/lead';

/**
 * Who sees the whole board and may reassign it. Everyone else — an ambassador,
 * typically — is scoped by the API to the leads assigned to them, so the UI
 * only has to drop the controls that would 403.
 */
export const LEAD_MANAGER_ROLES = ['admin', 'team'] as const;

/** Who may re-run enrichment or rebuild the links between leads and records. */
export const LEAD_ENRICH_ROLES = ['admin', 'team'] as const;

/**
 * The board's tabs, in display order. Each one is a route segment under
 * `/dashboard/leads/<preset>` so a filter can be linked to and survives reload.
 */
export const LEAD_PRESETS = [
  'all',
  'needs_action',
  'village',
  'member',
  'unenriched',
] as const;

export type LeadPreset = (typeof LEAD_PRESETS)[number];

export const LEAD_DEFAULT_PRESET: LeadPreset = 'all';

export const isLeadPreset = (value: string): value is LeadPreset =>
  (LEAD_PRESETS as readonly string[]).includes(value);

export const leadsTabPath = (preset: LeadPreset): string =>
  `/dashboard/leads/${preset}`;

/** The tab behind a `router.query.tab`; anything unknown lands on the default. */
export const resolveLeadPreset = (
  value: string | string[] | undefined,
): LeadPreset => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && isLeadPreset(raw)) return raw;
  return LEAD_DEFAULT_PRESET;
};

/**
 * Verdicts in the order a GTM person cares about them, best first, so a tone
 * can be picked without a lookup miss when the API adds one.
 */
const VERDICT_COLORS: Record<string, 'green' | 'blue' | 'neutral' | 'red'> = {
  fund_eligible: 'green',
  fit: 'blue',
  needs_info: 'neutral',
  not_fit: 'red',
};

export function isLeadsManager(user: User | null | undefined): boolean {
  if (!user?.roles?.length) return false;
  return LEAD_MANAGER_ROLES.some((role) => user.roles.includes(role));
}

export function canEnrichLeads(user: User | null | undefined): boolean {
  if (!user?.roles?.length) return false;
  return LEAD_ENRICH_ROLES.some((role) => user.roles.includes(role));
}

/**
 * The board query for a preset. Empty values are left off entirely rather than
 * sent blank, so the API applies its own defaults instead of filtering on ''.
 */
export function buildLeadsQuery(
  preset: LeadPreset,
  search: string,
): LeadsBoardParams {
  const q = search.trim();
  const base: LeadsBoardParams = q ? { q } : {};

  switch (preset) {
    case 'needs_action':
      return { ...base, verdict: 'fit' };
    case 'village':
      return { ...base, type: 'village' };
    case 'member':
      return { ...base, type: 'member' };
    case 'unenriched':
      return { ...base, status: 'pending' };
    default:
      return base;
  }
}

export function leadId(lead: Lead): string {
  const id = lead._id;
  return typeof id === 'string' ? id : String(id);
}

/** `managedBy` is an array on the model but a single owner in the UI. */
export function leadOwnerIds(lead: Lead): string[] {
  const value = lead.managedBy;
  if (!value) return [];
  const ids = Array.isArray(value) ? value : [value];
  return ids.map((id) => String(id)).filter(Boolean);
}

export function leadOwnerId(lead: Lead): string | null {
  return leadOwnerIds(lead)[0] ?? null;
}

/**
 * The best name we have. A member lead usually has a user, a village lead
 * usually has an application, and a cold one only ever has an email.
 */
export function leadDisplayName(lead: Lead): string {
  return (
    lead.user?.screenname?.trim() ||
    lead.applications?.[0]?.name?.trim() ||
    lead.email?.trim() ||
    ''
  );
}

export function leadPrimaryVillage(lead: Lead) {
  return lead.villages?.[0] ?? null;
}

/** Unwraps `/village/:id/fit`, which may come bare or inside `results`. */
export function fitCheckFromResponse(data: unknown): LeadFitCheck | null {
  const body = (data as { results?: unknown } | null)?.results ?? data;
  if (!body || typeof body !== 'object') return null;
  return body as LeadFitCheck;
}

/**
 * The explanation worth showing: one with something to say. An empty object
 * from an older job is treated as absent so the card can go and fetch it.
 */
export function fitExplanationOf(
  fit: LeadFitCheck | null | undefined,
): LeadFitExplanation | null {
  const explanation = fit?.explanation;
  if (!explanation) return null;
  const hasText = Boolean(
    explanation.headline?.trim() || explanation.detail?.trim(),
  );
  const hasLines = Boolean(
    explanation.failing?.length || explanation.unanswered?.length,
  );
  return hasText || hasLines ? explanation : null;
}

/**
 * Whether the card should ask the village endpoint for the explanation: a
 * village lead with a verdict the lead document does not explain itself.
 */
export function leadNeedsFitExplanation(lead: Lead): string | null {
  if (lead.type !== 'village') return null;
  if (!lead.fit?.verdict) return null;
  if (fitExplanationOf(lead.fit)) return null;
  return leadPrimaryVillage(lead)?._id ?? null;
}

/**
 * What the card is headed with. A village lead is about the village, so its
 * name leads and the contact behind it becomes the secondary line; every other
 * lead is headed with the person.
 */
export function leadTitle(lead: Lead): string {
  if (lead.type === 'village') {
    const villageName = leadPrimaryVillage(lead)?.name?.trim();
    if (villageName) return villageName;
  }
  return leadDisplayName(lead);
}

/**
 * Stages are an open enum that grows as the pipeline does, so callers render
 * `t.has(key) ? t(key) : stage` rather than trusting the key to exist.
 */
export function leadStageKey(stage: string | undefined): string {
  return stage ? `dashboard_leads_stage_${stage}` : '';
}

export function fitVerdictColor(
  verdict: LeadFitVerdict | undefined,
): 'green' | 'blue' | 'neutral' | 'red' {
  return (verdict && VERDICT_COLORS[verdict]) || 'neutral';
}

/**
 * A deterministic brief, written without the model. Fewer fields are filled, so
 * the card flags it rather than letting it read as researched.
 */
export function leadBriefIsFallback(lead: Lead): boolean {
  return lead.aiMeta?.provider === 'fallback';
}

export function leadIsEnriched(lead: Lead): boolean {
  return Boolean(lead.enrichedAt) && lead.status !== 'pending';
}

/** True once the date somebody promised to act by has passed. */
export function leadNextActionIsOverdue(
  lead: Lead,
  now: Date = new Date(),
): boolean {
  if (!lead.nextActionAt) return false;
  const due = new Date(lead.nextActionAt).getTime();
  if (Number.isNaN(due)) return false;
  return due < now.getTime();
}

/** Facts without a source never reach the client, but read defensively anyway. */
export function leadFactsWithSource(lead: Lead): LeadFact[] {
  return (lead.enrichment?.facts ?? []).filter(
    (fact) => fact && (fact.text || fact.label),
  );
}

export function leadOpenQuestions(lead: Lead): string[] {
  return (lead.enrichment?.openQuestions ?? []).filter((q) => q?.trim());
}

export function leadSuggestedCriteria(
  lead: Lead,
): { key: string; value: unknown; confidence?: number; sourceUrl?: string }[] {
  const suggested = lead.enrichment?.suggestedCriteria;
  if (!suggested || typeof suggested !== 'object') return [];
  return Object.entries(suggested).map(([key, entry]) => ({
    key,
    value: entry?.value,
    confidence: entry?.confidence,
    sourceUrl: entry?.sourceUrl,
  }));
}

/** The board returns `{ results, total }`; `total` is missing on short pages. */
export function leadsFromResponse(data: unknown): {
  rows: Lead[];
  total: number;
} {
  const body = data as { results?: unknown; total?: unknown } | null;
  const rows = Array.isArray(body?.results) ? (body?.results as Lead[]) : [];
  const total = Number(body?.total);
  return { rows, total: Number.isFinite(total) ? total : rows.length };
}

/** `nextActionAt` is stored as a timestamp but edited as a date input. */
export function dateInputValue(iso: string | undefined): string {
  if (!iso) return '';
  const date = dayjs(iso);
  return date.isValid() ? date.format('YYYY-MM-DD') : '';
}

export function draftFieldsFromLead(lead: Lead): LeadDraftFields {
  return {
    notes: lead.notes ?? '',
    tags: (lead.tags ?? []).join(', '),
    nextActionAt: dateInputValue(lead.nextActionAt),
  };
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Only the fields that actually changed are sent, so saving notes cannot clear
 * a date somebody else set between the load and the blur. `nextActionAt` sends
 * `null` when it is cleared — an empty string would fail date casting.
 */
export function buildLeadPatchPayload(
  lead: Lead,
  draft: LeadDraftFields,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const current = draftFieldsFromLead(lead);

  if (draft.notes !== current.notes) payload.notes = draft.notes;
  if (draft.tags !== current.tags) payload.tags = parseTags(draft.tags);
  if (draft.nextActionAt !== current.nextActionAt) {
    payload.nextActionAt = draft.nextActionAt
      ? dayjs(draft.nextActionAt).toISOString()
      : null;
  }

  return payload;
}

/** The first email a lead gets. Preferred whenever the API offers it. */
export const LEAD_INTRO_TEMPLATE = 'lead_intro';

/**
 * Templates the send modal offers, from `GET /leads/actions`. Entries without
 * a key cannot be sent and are dropped; a missing name falls back to the key.
 * An API that only lists `sendActions` still gets its `lead_*` templates —
 * `invite_owner` is a village action, not a lead template, and is left out.
 */
export function leadEmailTemplatesFrom(
  vocabulary:
    | { emailTemplates?: LeadEmailTemplate[]; sendActions?: string[] }
    | null
    | undefined,
): LeadEmailTemplate[] {
  const listed = (vocabulary?.emailTemplates ?? [])
    .filter((template) => template && typeof template.key === 'string')
    .map((template) => ({ ...template, name: template.name || template.key }));
  if (listed.length > 0) return listed;
  return (vocabulary?.sendActions ?? [])
    .filter(
      (action) => typeof action === 'string' && action.startsWith('lead_'),
    )
    .map((key) => ({ key, name: key }));
}

/** `lead_intro` when it is offered, else whatever the API lists first. */
export function defaultLeadEmailTemplate(
  templates: LeadEmailTemplate[],
): string {
  return (
    templates.find((template) => template.key === LEAD_INTRO_TEMPLATE)?.key ??
    templates[0]?.key ??
    ''
  );
}

/**
 * A batch send follows the tab it was opened from: the villages tab writes to
 * villages, the members tab to members, and every other tab to everyone.
 */
export function leadEmailTypeFor(preset: LeadPreset): LeadType | undefined {
  if (preset === 'village' || preset === 'member') return preset;
  return undefined;
}

/**
 * The four match criteria GTM answers by hand, in the order the card asks
 * them. Mirrors `QUALIFICATION_QUESTIONS` in closer-api's
 * utils/leads/qualification.js; the API validates the keys.
 */
export const LEAD_QUALIFICATION_KEYS: readonly LeadQualificationKey[] = [
  'isVillage',
  'landOwned',
  'communityForming',
  'ecologicalAmbition',
];

/**
 * The stored verdict when the API wrote one, else derived from the answers so
 * a lead edited a moment ago reads the same as one loaded fresh.
 */
export function leadQualificationVerdict(
  lead: Lead,
): LeadQualificationVerdict {
  const qualification = lead.qualification;
  if (qualification?.verdict) return qualification.verdict;
  const answers = LEAD_QUALIFICATION_KEYS.map((key) => qualification?.[key]);
  if (answers.some((value) => value === false)) return 'not_qualified';
  if (answers.every((value) => value === true)) return 'qualified';
  return 'pending';
}

export function leadQualificationAnswered(lead: Lead): number {
  return LEAD_QUALIFICATION_KEYS.filter(
    (key) => typeof lead.qualification?.[key] === 'boolean',
  ).length;
}

/**
 * A village lead somebody answered no for. Nothing about launching a village
 * goes to them and their draft cannot be published; the API refuses both, and
 * the card drops the controls that would be refused.
 */
export function leadIsRuledOut(lead: Lead): boolean {
  return (
    lead.type === 'village' && leadQualificationVerdict(lead) === 'not_qualified'
  );
}

export function qualificationVerdictColor(
  verdict: LeadQualificationVerdict | undefined,
): 'green' | 'red' | 'neutral' {
  if (verdict === 'qualified') return 'green';
  if (verdict === 'not_qualified') return 'red';
  return 'neutral';
}

/** When this template last went to the lead, or null if it never did. */
export function leadSentEmailAt(lead: Lead, template: string): string | null {
  const sent = (lead.emailsSent ?? []).filter(
    (entry) => entry?.template === template,
  );
  if (sent.length === 0) return null;
  return sent[sent.length - 1].at ?? '';
}

/** A draft is a village kept off the map. Older API rows carry only `visibility`. */
export function leadVillageIsDraft(village: LeadVillageRef): boolean {
  if (typeof village.isDraft === 'boolean') return village.isDraft;
  return village.visibility === 'private';
}

/**
 * When the owner invite went out: stamped on the village by newer APIs, and
 * otherwise read off the timeline the contact route writes.
 */
export function leadOwnerInvitedAt(lead: Lead): string | null {
  const village = leadPrimaryVillage(lead);
  if (village?.ownerInvitedAt) return village.ownerInvitedAt;
  const entry = [...(lead.activity ?? [])]
    .reverse()
    .find(
      (item) =>
        item?.kind === 'contacted' && /invite_owner/.test(item.note ?? ''),
    );
  return entry?.at ?? null;
}

export type LeadJourneyStepKey =
  | 'qualify'
  | 'village'
  | 'owner'
  | 'tell_us_more'
  | 'publish';

export interface LeadJourneyStep {
  key: LeadJourneyStepKey;
  /** The step is behind us. */
  done: boolean;
  /** Something can be done about it right now. */
  available: boolean;
  /** Ruled out on the match criteria: the step will not open. */
  blocked: boolean;
}

/**
 * The path a village lead takes from an application to a village on the map,
 * as the card draws it. Order matters: a draft village comes before the
 * owner invite because the invite hands over a record, and the tell-us-more
 * email waits for the invite because its link only works for someone who can
 * read the village. Publishing is last and is the one step that is truly
 * gated on qualification; the earlier ones are how the answers get found.
 */
export function leadJourney(lead: Lead): LeadJourneyStep[] {
  if (lead.type !== 'village') return [];
  const ruledOut = leadIsRuledOut(lead);
  const verdict = leadQualificationVerdict(lead);
  const village = leadPrimaryVillage(lead);
  const claimed = Boolean(village?.ownerClaimed);
  const invited = Boolean(leadOwnerInvitedAt(lead));
  const toldUsMore = leadSentEmailAt(lead, 'lead_next_step') !== null;
  const published = Boolean(village) && !leadVillageIsDraft(village!);

  const step = (
    key: LeadJourneyStepKey,
    done: boolean,
    available: boolean,
  ): LeadJourneyStep => ({
    key,
    done,
    available: available && !ruledOut,
    blocked: ruledOut && !done,
  });

  return [
    // Answering is always open: a no can be revisited.
    { key: 'qualify', done: verdict === 'qualified', available: true, blocked: ruledOut },
    step('village', Boolean(village), !village),
    step('owner', claimed, Boolean(village) && !claimed),
    step('tell_us_more', toldUsMore, Boolean(village) && (invited || claimed)),
    step('publish', published, Boolean(village) && !published),
  ];
}

/**
 * Where "create a draft village" sends a team member: the create page, told
 * which lead and application to pre-fill from and to keep the result a draft.
 */
export function leadCreateVillageHref(lead: Lead): string {
  const params = new URLSearchParams({ lead: leadId(lead), draft: '1' });
  const applicationId = lead.applications?.[0]?._id;
  if (applicationId) params.set('applicationId', String(applicationId));
  return `/villages/create?${params.toString()}`;
}
