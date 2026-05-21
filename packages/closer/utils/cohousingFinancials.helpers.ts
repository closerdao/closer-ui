import type { CohousingApplication } from '../types/cohousingApplication';

export const COHOUSING_TIER_RESERVATION_EUR: Record<string, number> = {
  low: 25000,
  standard: 50000,
  existing: 0,
};

export interface CohousingFinancialSummary {
  financingMode?: string;
  tier?: string;
  reservationAmount?: number;
  topupAmount?: number;
  topupRate?: number;
  totalAmount?: number;
  documentsAcknowledged?: boolean;
}

const reservationFromTier = (tier: string | undefined): number | undefined => {
  if (!tier) {
    return undefined;
  }
  return COHOUSING_TIER_RESERVATION_EUR[tier];
};

const getStep5CommitmentPayload = (app: CohousingApplication) => {
  const entry = (app.stepHistory || []).find(
    (e) => e?.event === 'participant_submitted' && Number(e?.step) === 5,
  );
  const payload = entry?.payload;
  if (payload && typeof payload === 'object') {
    return payload as Record<string, unknown>;
  }
  return null;
};

export const getCohousingFinancialSummary = (
  app: CohousingApplication,
): CohousingFinancialSummary | null => {
  const financingMode = app.financingMode || undefined;
  const tier = app.tier || undefined;
  const payload = getStep5CommitmentPayload(app);

  if (!financingMode && !tier && !app.reservationLoan && !payload) {
    return null;
  }

  const payloadTier =
    typeof payload?.tier === 'string' ? payload.tier : undefined;
  const resolvedTier = tier ?? payloadTier;

  const payloadTopup =
    typeof payload?.topupAmount === 'number' ? payload.topupAmount : undefined;
  const payloadTotal =
    typeof payload?.total === 'number' ? payload.total : undefined;
  const payloadTopupRate =
    typeof payload?.topupRate === 'number' ? payload.topupRate : undefined;

  const reservationAmount =
    app.reservationLoan?.amount ??
    (payloadTotal != null && payloadTopup != null
      ? payloadTotal - payloadTopup
      : reservationFromTier(resolvedTier));

  const topupAmount = app.topupLoan?.amount ?? payloadTopup;
  const topupRate = app.topupLoan?.rate ?? payloadTopupRate;

  const totalAmount =
    payloadTotal ??
    (reservationAmount != null
      ? reservationAmount + (topupAmount ?? 0)
      : undefined);

  return {
    financingMode,
    tier: resolvedTier,
    reservationAmount,
    topupAmount: topupAmount && topupAmount > 0 ? topupAmount : undefined,
    topupRate:
      topupRate != null && (topupAmount ?? 0) > 0 ? topupRate : undefined,
    totalAmount,
    documentsAcknowledged: app.financingDocumentsAcknowledged,
  };
};

export const getCohousingTierLabelKey = (tier: string) =>
  `cohousing_commit_tier_${tier}` as const;

export const aggregateCohousingFundsCommitted = (
  apps: CohousingApplication[],
): { total: number; count: number } => {
  let total = 0;
  let count = 0;
  for (const app of apps) {
    const summary = getCohousingFinancialSummary(app);
    if (summary?.totalAmount != null && summary.totalAmount > 0) {
      total += summary.totalAmount;
      count += 1;
    }
  }
  return { total, count };
};
