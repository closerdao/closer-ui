import { User } from '../contexts/auth/types';

import { EngagementOpportunity } from '../types/engagement';

export const ENGAGEMENT_MANAGER_ROLES = ['admin', 'community-curator'] as const;

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
        { status: 'assigned' },
      ],
    };
  }

  if (preset === 'active') {
    return { status: 'assigned' };
  }

  if (preset === 'high') {
    return {
      $and: [{ status: 'assigned' }, { priority: 'high' }],
    };
  }

  return { status: 'assigned' };
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
