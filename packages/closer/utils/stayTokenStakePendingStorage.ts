import type { StayTokenStakePlan } from '../types/stay';
import type { PendingStayTokenStake } from '../types/stayTokenStake';

const storageKey = (stayId: string) =>
  `closer:stay-token-stake-pending:${stayId}`;

const validHashes = (values: unknown[]) => [
  ...new Set(
    values
      .filter(
        (value): value is string =>
          typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value),
      )
      .map((value) => value.toLowerCase()),
  ),
];

// Hashes survive price-segment changes; only the progress cursor is plan-specific.
// The backend validates every reference against the wallet and exact night rates.
export const readPendingStayTransactionIds = (stayId: string): string[] => {
  try {
    if (typeof window === 'undefined') return [];
    const parsed = JSON.parse(
      window.sessionStorage.getItem(storageKey(stayId)) || 'null',
    );
    return validHashes([
      ...(Array.isArray(parsed?.transactionIds) ? parsed.transactionIds : []),
      parsed?.transactionId,
    ]);
  } catch {
    return [];
  }
};

export const readPendingStayTokenStake = (
  stayId: string,
  nightsKey: string,
): PendingStayTokenStake | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(storageKey(stayId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingStayTokenStake>;
    if (
      typeof parsed.transactionId === 'string' &&
      parsed.nightsKey === nightsKey
    ) {
      const completedNightCount = Number(parsed.completedNightCount);
      return {
        transactionId: parsed.transactionId,
        ...(readPendingStayTransactionIds(stayId).length && {
          transactionIds: readPendingStayTransactionIds(stayId),
        }),
        nightsKey,
        completedNightCount:
          Number.isSafeInteger(completedNightCount) && completedNightCount >= 0
            ? completedNightCount
            : 0,
        ...(typeof parsed.planKey === 'string'
          ? {
              ...(parsed.phase === 'verifying' && {
                phase: 'verifying' as const,
              }),
              planKey: parsed.planKey,
            }
          : {}),
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const writePendingStayTokenStake = (
  stayId: string,
  transactionId: string,
  nightsKey: string,
  completedNightCount = 0,
  verification?: { phase?: 'verifying'; planKey: string },
) => {
  try {
    if (typeof window === 'undefined') return;
    const transactionIds = validHashes([
      ...readPendingStayTransactionIds(stayId),
      transactionId,
    ]);
    const payload: PendingStayTokenStake = {
      ...(transactionIds.length && { transactionIds }),
      transactionId,
      nightsKey,
      completedNightCount,
      ...verification,
    };
    window.sessionStorage.setItem(storageKey(stayId), JSON.stringify(payload));
  } catch {}
};

export const clearPendingStayTokenStake = (stayId: string) => {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(storageKey(stayId));
  } catch {}
};

export const stayTokenStakePlanKey = (plan: StayTokenStakePlan) =>
  JSON.stringify([
    plan.decimals,
    plan.segments.map((segment) => [
      segment.bookingNights,
      segment.pricePerNightWei,
    ]),
  ]);

export const readPendingStayTokenVerification = (
  stayId: string,
  plan: StayTokenStakePlan | null,
): PendingStayTokenStake | null => {
  if (!plan) return null;
  const pending = readPendingStayTokenStake(
    stayId,
    JSON.stringify(plan.bookingNights),
  );
  return pending?.phase === 'verifying' &&
    pending.planKey === stayTokenStakePlanKey(plan)
    ? pending
    : null;
};

export const writePendingStayTokenVerification = (
  stayId: string,
  transactionId: string,
  plan: StayTokenStakePlan,
): PendingStayTokenStake => {
  const planKey = stayTokenStakePlanKey(plan);
  const pending: PendingStayTokenStake = {
    transactionId,
    nightsKey: JSON.stringify(plan.bookingNights),
    completedNightCount: plan.bookingNights.length,
    phase: 'verifying',
    planKey,
  };
  writePendingStayTokenStake(
    stayId,
    transactionId,
    pending.nightsKey,
    pending.completedNightCount,
    { phase: 'verifying', planKey },
  );
  return readPendingStayTokenStake(stayId, pending.nightsKey) || pending;
};
