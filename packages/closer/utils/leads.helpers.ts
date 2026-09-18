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
  LeadProgramInvite,
  LeadProgramKey,
  LeadQualificationKey,
  LeadQualificationVerdict,
  LeadType,
  LeadVillageRef,
  LeadsBoardParams,
} from '../types/lead';
import { humanizeConfigKey } from './config.utils';

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
  'unassigned',
  'mine',
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
    case 'unassigned':
      return { ...base, managedBy: 'unassigned' };
    case 'mine':
      // The API resolves `me` to the caller, so the tab links without an id.
      return { ...base, managedBy: 'me' };
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

/**
 * The person's actual name, or nothing. Unlike `leadDisplayName` this does not
 * fall back to the email address — a search prefilled with an email where a
 * name belongs returns noise, and a "who is this" block headed by an address
 * says nothing the row above it did not.
 */
export function leadPersonName(lead: Lead): string {
  return (
    lead.user?.screenname?.trim() || lead.applications?.[0]?.name?.trim() || ''
  );
}

export interface LeadResearchLink {
  key: 'web' | 'linkedin';
  href: string;
}

/**
 * Prefilled searches for the first question anyone asks about a cold lead: is
 * this a real person? Built from whatever identifies them — the web search
 * takes the name and the project together, falling back to the email address.
 * LinkedIn's people search only understands names, so it is left out when we
 * have none rather than offered as a search for an email that finds nobody.
 */
export function leadResearchLinks(lead: Lead): LeadResearchLink[] {
  const name = leadPersonName(lead);
  const email = lead.email?.trim() ?? '';
  const village = leadPrimaryVillage(lead)?.name?.trim() ?? '';
  const webTerms = name ? [name, village].filter(Boolean).join(' ') : email;
  if (!webTerms) return [];

  const links: LeadResearchLink[] = [
    {
      key: 'web',
      href: `https://www.google.com/search?q=${encodeURIComponent(webTerms)}`,
    },
  ];
  if (name) {
    links.push({
      key: 'linkedin',
      href: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        name,
      )}`,
    });
  }
  return links;
}

export interface LeadAnswer {
  key: string;
  label: string;
  value: string;
}

/**
 * What the applicant typed into the application form. The questions are set
 * per instance and land in `fields`, so the keys are humanised rather than
 * translated. Anything that is not a scalar or a list of them is skipped:
 * a nested object on a lead card is noise, not evidence.
 */
export function leadApplicationAnswers(lead: Lead): LeadAnswer[] {
  const fields = lead.applications?.[0]?.fields;
  if (!fields || typeof fields !== 'object') return [];
  return Object.entries(fields).flatMap(([key, raw]) => {
    const value = Array.isArray(raw)
      ? raw
          .filter((item) => item !== null && typeof item !== 'object')
          .join(', ')
      : raw !== null && typeof raw === 'object'
        ? ''
        : String(raw ?? '');
    if (!value.trim()) return [];
    return [{ key, label: humanizeConfigKey(key), value }];
  });
}

/** True of a value the card should render as a link rather than as text. */
export const isHttpUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value.trim());

/**
 * The links a person gave us about themselves — their named profile links and
 * whatever social handles are stored as full URLs. De-duplicated on the href,
 * because the same site is often in both places.
 */
export function leadProfileLinks(lead: Lead): { name: string; url: string }[] {
  const named = (lead.user?.links ?? [])
    .filter((link) => link?.url && isHttpUrl(link.url))
    .map((link) => ({ name: link.name?.trim() || link.url!, url: link.url! }));
  const social = Object.entries(lead.user?.settings?.social ?? {})
    .filter(([, url]) => typeof url === 'string' && isHttpUrl(url))
    .map(([name, url]) => ({ name: humanizeConfigKey(name), url }));
  const seen = new Set<string>();
  return [...named, ...social].filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
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

/**
 * The board returns `{ results, pagination: { total } }`. Older deploys and the
 * `/leads/board` alias answered with a bare `total`, so both are read before
 * falling back to the page length — a fallback that silently caps the board at
 * one page, which is why it is the last resort rather than the first.
 */
export function leadsFromResponse(data: unknown): {
  rows: Lead[];
  total: number;
} {
  const body = data as {
    results?: unknown;
    total?: unknown;
    pagination?: { total?: unknown };
  } | null;
  const rows = Array.isArray(body?.results) ? (body?.results as Lead[]) : [];
  for (const candidate of [body?.pagination?.total, body?.total]) {
    const total = Number(candidate);
    if (Number.isFinite(total)) return { rows, total };
  }
  return { rows, total: rows.length };
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
    qualificationNote: lead.qualification?.note ?? '',
    callTranscript: lead.call?.transcript ?? '',
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
  // Sent under `qualification`, which the API merges over the stored answers —
  // so a note saves without restating the four yes / no answers alongside it.
  if (draft.qualificationNote !== current.qualificationNote) {
    payload.qualification = { note: draft.qualificationNote };
  }
  // The same for the call: the transcript saves without touching its dates.
  if (draft.callTranscript !== current.callTranscript) {
    payload.call = { transcript: draft.callTranscript };
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
    | {
        emailTemplates?: LeadEmailTemplate[];
        sendActions?: string[];
        batchSendActions?: string[];
      }
    | null
    | undefined,
): LeadEmailTemplate[] {
  // A program invitation is a decision about one village, made from the
  // card: it is never offered to a batch.
  const batchable = vocabulary?.batchSendActions;
  const listed = (vocabulary?.emailTemplates ?? [])
    .filter((template) => template && typeof template.key === 'string')
    .filter((template) => !template.program)
    .filter((template) => !batchable || batchable.includes(template.key))
    .map((template) => ({ ...template, name: template.name || template.key }));
  if (listed.length > 0) return listed;
  return (vocabulary?.sendActions ?? [])
    .filter(
      (action) =>
        typeof action === 'string' &&
        action.startsWith('lead_') &&
        !action.startsWith('lead_invite_'),
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
export function leadQualificationVerdict(lead: Lead): LeadQualificationVerdict {
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
 * A village lead somebody answered no for. The match criteria are the OASA
 * fund's bar, so this closes the fund to them for good; whether it closes
 * anything else is `leadIsBlocked`.
 */
export function leadIsRuledOut(lead: Lead): boolean {
  return (
    lead.type === 'village' &&
    leadQualificationVerdict(lead) === 'not_qualified'
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

export interface LeadHistoryEntry {
  at?: string;
  by?: string;
  kind: string;
  from?: string;
  to?: string;
  note?: string;
}

/**
 * One timeline out of the two the API keeps: the activity log and the record of
 * emails sent. They answer the same question — what has happened to this lead —
 * and reading them as separate lists means reconstructing the order by eye.
 *
 * Newest first. An entry without a date sorts last rather than being dropped:
 * an unstamped decision still happened.
 */
export function leadHistory(lead: Lead): LeadHistoryEntry[] {
  const activity: LeadHistoryEntry[] = (lead.activity ?? [])
    .filter(Boolean)
    .map((entry) => ({
      at: entry.at,
      by: entry.by,
      kind: entry.kind ?? 'noted',
      from: entry.from,
      to: entry.to,
      note: entry.note,
    }));
  const emails: LeadHistoryEntry[] = (lead.emailsSent ?? [])
    .filter(Boolean)
    .map((entry) => ({
      at: entry.at,
      by: entry.by ?? undefined,
      kind: 'emailed',
      to: entry.template ?? entry.slug,
    }));

  const time = (entry: LeadHistoryEntry) => {
    const value = entry.at ? new Date(entry.at).getTime() : NaN;
    return Number.isNaN(value) ? -Infinity : value;
  };
  return [...activity, ...emails].sort((a, b) => time(b) - time(a));
}

/** Everyone named in the timeline, so the board can resolve them to names. */
export function leadHistoryActorIds(lead: Lead): string[] {
  return leadHistory(lead)
    .map((entry) => entry.by)
    .filter((id): id is string => Boolean(id));
}

/**
 * The two programs a village lead can be invited into, in the order the card
 * offers them. Mirrors `LEAD_PROGRAMS` in closer-api's utils/leads/programs.js.
 */
export const LEAD_PROGRAM_KEYS: readonly LeadProgramKey[] = [
  'closer',
  'oasa_fund',
];

/** The fund is a team decision; running on Closer is open to anyone who pays. */
export const LEAD_MANAGER_ONLY_PROGRAMS: readonly LeadProgramKey[] = [
  'oasa_fund',
];

export function isLeadProgramKey(value: unknown): value is LeadProgramKey {
  return (
    typeof value === 'string' &&
    (LEAD_PROGRAM_KEYS as readonly string[]).includes(value)
  );
}

/** The stored invitation for one program, or null if it never went out. */
export function leadProgramInvite(
  lead: Lead,
  program: LeadProgramKey,
): LeadProgramInvite | null {
  const invite = lead.programs?.[program];
  return invite?.invitedAt ? invite : null;
}

export function leadInvitedPrograms(lead: Lead): LeadProgramKey[] {
  return LEAD_PROGRAM_KEYS.filter((key) => leadProgramInvite(lead, key));
}

/**
 * Whether the launch steps - owner invite, tell-us-more, publishing - are
 * closed to this lead: ruled out on the match criteria and not invited to run
 * on Closer either. Running on Closer asks for no match, so an invitation
 * there reopens the path. Mirrors `isLeadBlocked` in closer-api's
 * utils/leads/programs.js, which refuses the same steps.
 */
export function leadIsBlocked(lead: Lead): boolean {
  return leadIsRuledOut(lead) && !leadProgramInvite(lead, 'closer');
}

/** Whether this lead may be invited into the program at all. */
export function leadCanBeInvitedTo(
  lead: Lead,
  program: LeadProgramKey,
): boolean {
  if (lead.type !== 'village') return false;
  return program === 'closer' || !leadIsRuledOut(lead);
}

/** When the call is booked for, or null. */
export function leadCallScheduledAt(lead: Lead): string | null {
  return lead.call?.scheduledAt || null;
}

/** When the call took place, or null while it has not. */
export function leadCallDoneAt(lead: Lead): string | null {
  return lead.call?.doneAt || null;
}

/** A booked call whose time has come and gone without being marked done. */
export function leadCallIsOverdue(lead: Lead, now: Date = new Date()): boolean {
  const scheduledAt = leadCallScheduledAt(lead);
  if (!scheduledAt || leadCallDoneAt(lead)) return false;
  const due = new Date(scheduledAt).getTime();
  return !Number.isNaN(due) && due < now.getTime();
}

/**
 * `scheduledAt` is a timestamp, edited through a `datetime-local` input whose
 * value is local wall-clock time without a zone.
 */
export function dateTimeInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = dayjs(iso);
  return date.isValid() ? date.format('YYYY-MM-DDTHH:mm') : '';
}

/** Somebody holds this lead. */
export function leadIsClaimed(lead: Lead): boolean {
  return leadOwnerIds(lead).length > 0;
}

/**
 * The conversation is under way: the lead is held and the application (if
 * any) has left `open`. A village lead with no application counts once it is
 * held and has been contacted.
 */
export function leadConversationStarted(lead: Lead): boolean {
  if (!leadIsClaimed(lead)) return false;
  const application = lead.applications?.[0];
  if (application) return (application.status ?? 'open') !== 'open';
  return Boolean(lead.lastContactedAt);
}

export type LeadPrimaryActionKey =
  | 'start'
  | 'schedule_call'
  | 'call_done'
  | 'invite'
  | 'create_village'
  | 'invite_owner'
  | 'tell_us_more'
  | 'publish';

/**
 * The one thing to do next with this lead, so the board can put a single
 * button on the row. In order: take it, talk to them, invite them, then walk
 * the village onto the map.
 *
 * The call is how the match criteria get answered, so the row stops asking
 * for one once they all are - or once an invitation has gone out, which says
 * the team already knows enough. The match criteria themselves never hold the
 * row: running on Closer asks for no match, so after the call the button is
 * the invitation and qualifying is something the card offers alongside it.
 *
 * `null` when nothing is waiting on us: a lead whose village is already
 * published, one invited into the fund and ruled out afterwards, or a member
 * lead that is already in conversation (approving members happens on the
 * applications page, where the answers are).
 */
export function leadPrimaryAction(lead: Lead): LeadPrimaryActionKey | null {
  if (!leadConversationStarted(lead)) return 'start';
  if (lead.type !== 'village') return null;
  const invited = leadInvitedPrograms(lead).length > 0;
  if (
    !invited &&
    !leadCallDoneAt(lead) &&
    leadQualificationVerdict(lead) === 'pending'
  ) {
    return leadCallScheduledAt(lead) ? 'call_done' : 'schedule_call';
  }
  if (!invited) return 'invite';
  if (leadIsBlocked(lead)) return null;
  const next = leadJourney(lead).find(
    (step) =>
      !step.done &&
      step.available &&
      step.key !== 'qualify' &&
      step.key !== 'call',
  );
  switch (next?.key) {
    case 'village':
      return 'create_village';
    case 'owner':
      return 'invite_owner';
    case 'tell_us_more':
      return 'tell_us_more';
    case 'publish':
      return 'publish';
    default:
      return null;
  }
}

export type LeadJourneyStepKey =
  | 'start'
  | 'call'
  | 'qualify'
  | 'program'
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
 * read the village. The call sits right after taking the lead because it is
 * where the match criteria get answered.
 *
 * The match criteria gate the OASA fund, not the path: a lead invited to run
 * on Closer walks every step whatever the answers were. Only a lead that was
 * ruled out and has no Closer invitation finds the launch steps closed.
 */
export function leadJourney(lead: Lead): LeadJourneyStep[] {
  if (lead.type !== 'village') return [];
  const ruledOut = leadIsRuledOut(lead);
  const blocked = leadIsBlocked(lead);
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
    available: available && !blocked,
    blocked: blocked && !done,
  });

  const started = leadConversationStarted(lead);
  const programChosen = leadInvitedPrograms(lead).length > 0;

  return [
    // Taking the lead comes first: nothing below is anyone's job until then.
    { key: 'start', done: started, available: !started, blocked: false },
    // Open to anyone, ruled out or not: a call is how a no gets revisited.
    {
      key: 'call',
      done: Boolean(leadCallDoneAt(lead)),
      available: started && !leadCallDoneAt(lead),
      blocked: false,
    },
    // Answering is always open: a no can be revisited.
    {
      key: 'qualify',
      done: verdict === 'qualified',
      available: true,
      blocked: ruledOut,
    },
    // Which door: Closer for anyone who pays - match or no match - and the
    // fund for the chosen few. Never blocked, because Closer never is.
    {
      key: 'program',
      done: programChosen,
      available: !programChosen,
      blocked: false,
    },
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
