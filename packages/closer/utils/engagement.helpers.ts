import { User } from '../contexts/auth/types';

import {
  EngagementDraftFields,
  EngagementOpportunity,
  EngagementOpportunityStatus,
} from '../types/engagement';

export const ENGAGEMENT_MANAGER_ROLES = ['admin', 'community-curator'] as const;

/** Statuses that hold one of the open slots the daily job may fill. */
export const ENGAGEMENT_OPEN_STATUSES: EngagementOpportunityStatus[] = [
  'queued',
  'assigned',
  'approved',
];

export const ENGAGEMENT_HOST_STATUSES: EngagementOpportunityStatus[] = [
  'assigned',
  'approved',
];

export const ENGAGEMENT_FOLLOW_UP_STATUSES: EngagementOpportunityStatus[] = [
  ...ENGAGEMENT_OPEN_STATUSES,
  'contacted',
];

/**
 * Rows that have left the queue. They are no longer soft-deleted, so the API
 * returns them and the UI can offer a history view over past outreach.
 */
export const ENGAGEMENT_CLOSED_STATUSES: EngagementOpportunityStatus[] = [
  'contacted',
  'converted',
  'dismissed',
  'expired',
];

/** Rows untouched for this long are expired and auto-dismissed by the job. */
export const ENGAGEMENT_STALE_DAYS = 14;

/** Max rows the job keeps open at once, shown so an empty queue reads as normal. */
export const ENGAGEMENT_MAX_OPEN = 10;

/** The letter the backend now drafts aims for this many words. */
export const ENGAGEMENT_BODY_MIN_WORDS = 150;
export const ENGAGEMENT_BODY_MAX_WORDS = 250;

export type EngagementListPreset = 'active' | 'high' | 'all_open' | 'archive';

export const ENGAGEMENT_LIST_PRESETS: EngagementListPreset[] = [
  'active',
  'high',
  'all_open',
  'archive',
];

export function userIsEngagementManager(user: User | null | undefined): boolean {
  if (!user?.roles?.length) return false;
  return ENGAGEMENT_MANAGER_ROLES.some((r) => user.roles.includes(r));
}

export function buildEngagementListWhere(
  isManager: boolean,
  preset: EngagementListPreset,
  userId: string,
): Record<string, unknown> {
  if (!isManager) {
    return {
      $and: [
        { managedBy: { $in: [userId] } },
        { status: { $in: ENGAGEMENT_HOST_STATUSES } },
      ],
    };
  }

  if (preset === 'high') {
    return {
      $and: [
        { status: { $in: ENGAGEMENT_OPEN_STATUSES } },
        { priority: 'high' },
      ],
    };
  }

  if (preset === 'all_open') {
    return { status: { $in: ENGAGEMENT_FOLLOW_UP_STATUSES } };
  }

  if (preset === 'archive') {
    return { status: { $in: ENGAGEMENT_CLOSED_STATUSES } };
  }

  return { status: { $in: ENGAGEMENT_OPEN_STATUSES } };
}

export function opportunityEnrichmentPending(
  opp: EngagementOpportunity,
): boolean {
  const subject = outreachSubject(opp).trim();
  return !subject && !opp.enrichmentCompletedAt;
}

export function copyIsAiDrafted(provider: string | undefined): boolean {
  return provider === 'anthropic';
}

/**
 * Drafts now come from Claude by default; `deterministic` and `fallback` both
 * mean the template path ran instead, which is copy worth editing harder.
 */
export function copyProviderKey(provider: string | undefined): string {
  if (copyIsAiDrafted(provider)) return 'engagement_copy_provider_anthropic';
  return 'engagement_copy_provider_deterministic';
}

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g;

/**
 * The outreach renderer turns `[text](url)` in the body into anchors, so the
 * queue lists them separately — a curator cannot check a destination that is
 * only ever shown as raw markdown inside a textarea.
 */
export function markdownLinks(
  body: string,
): { text: string; url: string }[] {
  const found: { text: string; url: string }[] = [];
  for (const match of body.matchAll(MARKDOWN_LINK)) {
    found.push({ text: match[1], url: match[2] });
  }
  return found;
}

export function bodyWordCount(body: string): number {
  const trimmed = body.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Statuses that have already had their outcome recorded — the row is history,
 * so the action buttons come off rather than being rendered disabled.
 */
export function opportunityIsActionable(opp: EngagementOpportunity): boolean {
  return (
    opp.status !== 'dismissed' &&
    opp.status !== 'converted' &&
    opp.status !== 'expired'
  );
}

/**
 * True while the row still holds one of the open slots. `contactedAt` and
 * `dismissedAt` are checked too: the backend stamps them whenever a row leaves
 * the queue, so they catch a row whose status has not been refetched yet.
 */
export function opportunityIsOpen(opp: EngagementOpportunity): boolean {
  if (opp.contactedAt || opp.dismissedAt) return false;
  return opp.status != null && ENGAGEMENT_OPEN_STATUSES.includes(opp.status);
}

/**
 * Days left before the job's sweep expires and auto-dismisses an untouched row.
 * Only open rows run the clock — once somebody has contacted, converted or
 * dismissed, the slot is free and the sweep no longer applies.
 */
export function opportunityDaysUntilExpiry(
  opp: EngagementOpportunity,
  now: Date = new Date(),
): number | null {
  if (!opp.created || !opportunityIsOpen(opp)) return null;
  const created = new Date(opp.created).getTime();
  if (Number.isNaN(created)) return null;
  const elapsedDays = (now.getTime() - created) / 86400000;
  return Math.max(0, Math.ceil(ENGAGEMENT_STALE_DAYS - elapsedDays));
}

export function journeyHighlights(opp: EngagementOpportunity): string[] {
  return opp.signals?.journeyHighlights ?? [];
}

export function managedByDisplayLines(
  opp: EngagementOpportunity,
): string[] {
  const ids = opp.managedBy ?? [];
  if (!ids.length) return [];
  const ranked =
    opp.aiMeta?.hostMatching?.rankedHosts ?? opp.hostMatchReasons ?? [];
  return ids.map((uid) => {
    const u = String(uid);
    const match = ranked.find(
      (r) => r.hostId != null && String(r.hostId) === u,
    );
    if (match?.hostName && match?.hostEmail) {
      return `${match.hostName} (${match.hostEmail})`;
    }
    if (match?.hostName) return match.hostName;
    if (match?.hostEmail) return match.hostEmail;
    return u.length > 14 ? `…${u.slice(-8)}` : u;
  });
}

export function engagementRowsFromFetchAction(action: unknown): {
  rows: EngagementOpportunity[];
  total: number;
} {
  const a = action as {
    results?: { toJS?: () => unknown };
    total?: number;
  };
  let rows: EngagementOpportunity[] = [];
  const raw = a?.results;
  if (
    raw &&
    typeof raw === 'object' &&
    'toJS' in raw &&
    typeof (raw as { toJS: () => unknown }).toJS === 'function'
  ) {
    const js = (raw as { toJS: () => unknown }).toJS();
    rows = Array.isArray(js) ? (js as EngagementOpportunity[]) : [];
  }
  const total =
    typeof a?.total === 'number' && !Number.isNaN(a.total)
      ? a.total
      : rows.length;
  return { rows, total };
}

export function opportunityId(opp: EngagementOpportunity): string {
  const id = opp._id;
  return typeof id === 'string' ? id : String(id);
}

export function clampRewardCarrots(amount: number): number {
  if (Number.isNaN(amount)) return 0;
  return Math.min(2, Math.max(0, Math.round(amount)));
}

function rewardField(
  opp: EngagementOpportunity,
  field: string,
): unknown {
  const r = opp.reward;
  if (!r || typeof r !== 'object' || !(field in r)) return undefined;
  return (r as Record<string, unknown>)[field];
}

/** The stored carrot amount, clamped to what the reward budget allows. */
export function rewardCarrots(opp: EngagementOpportunity): number {
  return clampRewardCarrots(Number(rewardField(opp, 'amount') ?? 0));
}

export function rewardMessage(opp: EngagementOpportunity): string {
  return String(rewardField(opp, 'message') ?? '');
}

export function rewardSource(opp: EngagementOpportunity): string {
  return String(rewardField(opp, 'source') ?? '');
}

export function rewardCreditsAwarded(opp: EngagementOpportunity): boolean {
  const awardedAt = rewardField(opp, 'awardedAt');
  return awardedAt != null && awardedAt !== '';
}

export function buildRewardPayload(
  opp: EngagementOpportunity,
  amount: number,
): Record<string, unknown> {
  const existing =
    opp.reward && typeof opp.reward === 'object'
      ? { ...(opp.reward as Record<string, unknown>) }
      : {};
  const amt = clampRewardCarrots(amount);
  return {
    ...existing,
    amount: amt,
    currency: 'credits',
  };
}

export function outreachSubject(opp: EngagementOpportunity): string {
  return opp.subject ?? opp.outreachDraft?.subject ?? '';
}

export function outreachBody(opp: EngagementOpportunity): string {
  return opp.body ?? opp.outreachDraft?.body ?? '';
}

export function outreachCtaLink(opp: EngagementOpportunity): string {
  return opp.ctaLink ?? '';
}

export function outreachCtaText(opp: EngagementOpportunity): string {
  return opp.ctaText ?? '';
}

export function hostBriefText(opp: EngagementOpportunity): string {
  if (typeof opp.hostBrief === 'string') return opp.hostBrief;
  if (
    opp.hostBrief &&
    typeof opp.hostBrief === 'object' &&
    'summary' in opp.hostBrief
  ) {
    return (opp.hostBrief as { summary?: string }).summary ?? '';
  }
  return '';
}

export function draftFieldsFromOpportunity(
  opp: EngagementOpportunity,
): EngagementDraftFields {
  return {
    subject: outreachSubject(opp),
    body: outreachBody(opp),
    ctaLink: outreachCtaLink(opp),
    ctaText: outreachCtaText(opp),
    hostBrief: hostBriefText(opp),
  };
}

export function buildDraftPatchPayload(
  draft: EngagementDraftFields,
): Record<string, string> {
  const payload: Record<string, string> = {
    subject: draft.subject,
    body: draft.body,
  };
  if (draft.ctaLink.trim()) payload.ctaLink = draft.ctaLink.trim();
  if (draft.ctaText.trim()) payload.ctaText = draft.ctaText.trim();
  if (draft.hostBrief.trim()) payload.hostBrief = draft.hostBrief.trim();
  return payload;
}
