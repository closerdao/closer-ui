import { User } from '../contexts/auth/types';

import {
  EngagementOpportunity,
  EngagementOpportunityStatus,
} from '../types/engagement';

export const ENGAGEMENT_MANAGER_ROLES = ['admin', 'community-curator'] as const;

export const ENGAGEMENT_OPEN_STATUSES: EngagementOpportunityStatus[] = [
  'queued',
  'assigned',
  'host_notified',
  'approved',
];

export const ENGAGEMENT_HOST_STATUSES: EngagementOpportunityStatus[] = [
  'assigned',
  'host_notified',
  'approved',
];

export const ENGAGEMENT_FOLLOW_UP_STATUSES: EngagementOpportunityStatus[] = [
  ...ENGAGEMENT_OPEN_STATUSES,
  'contacted',
];

export type EngagementListPreset = 'active' | 'high' | 'all_open';

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

  return { status: { $in: ENGAGEMENT_OPEN_STATUSES } };
}

export function opportunityEnrichmentPending(
  opp: EngagementOpportunity,
): boolean {
  const subject = outreachSubject(opp).trim();
  return !subject && !opp.enrichmentCompletedAt;
}

export function copyProviderKey(provider: string | undefined): string {
  if (provider === 'anthropic') return 'engagement_copy_provider_anthropic';
  return 'engagement_copy_provider_deterministic';
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

export function rewardCreditsAwarded(opp: EngagementOpportunity): boolean {
  const r = opp.reward;
  if (!r || typeof r !== 'object') return false;
  return (
    'awardedAt' in r &&
    (r as { awardedAt?: string }).awardedAt != null &&
    (r as { awardedAt?: string }).awardedAt !== ''
  );
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
): {
  subject: string;
  body: string;
  ctaLink: string;
  ctaText: string;
  hostBrief: string;
} {
  return {
    subject: outreachSubject(opp),
    body: outreachBody(opp),
    ctaLink: outreachCtaLink(opp),
    ctaText: outreachCtaText(opp),
    hostBrief: hostBriefText(opp),
  };
}

export function buildDraftPatchPayload(
  draft: {
    subject: string;
    body: string;
    ctaLink: string;
    ctaText: string;
    hostBrief: string;
  },
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
