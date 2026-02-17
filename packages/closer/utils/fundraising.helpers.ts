import {
  FundraisingConfig,
  FundraisingMilestone,
  MilestoneStatus,
} from '../types/api';
import api, { formatSearch } from './api';

export const getMilestoneStart = (m: FundraisingMilestone): string | null =>
  m.start ?? m.startDate ?? null;
export const getMilestoneEnd = (m: FundraisingMilestone): string | null =>
  m.end ?? m.endDate ?? null;
export const getMilestoneGoal = (m: FundraisingMilestone): number =>
  Number(m.goal ?? m.targetAmount) || 0;

export const sortMilestonesByStartDate = (
  milestones: FundraisingMilestone[],
): FundraisingMilestone[] =>
  [...(milestones ?? [])].sort((a, b) => {
    const startA = getMilestoneStart(a)
      ? new Date(getMilestoneStart(a)!).getTime()
      : 0;
    const startB = getMilestoneStart(b)
      ? new Date(getMilestoneStart(b)!).getTime()
      : 0;
    return startA - startB;
  });

export const findActiveMilestone = (
  milestones: FundraisingMilestone[] | undefined,
): FundraisingMilestone | null => {
  if (!milestones || milestones.length === 0) return null;
  const sorted = sortMilestonesByStartDate(milestones);
  const now = new Date();
  const FAR_FUTURE = new Date('2100-01-01T00:00:00.000Z');

  const sortedByStartDesc = [...sorted].sort((a, b) => {
    const startA = getMilestoneStart(a)
      ? new Date(getMilestoneStart(a)!).getTime()
      : 0;
    const startB = getMilestoneStart(b)
      ? new Date(getMilestoneStart(b)!).getTime()
      : 0;
    return startB - startA;
  });

  const activeMilestone = sortedByStartDesc.find((m) => {
    const startRaw = getMilestoneStart(m);
    if (!startRaw) return false;
    const start = new Date(startRaw);
    start.setHours(0, 0, 0, 0);
    const endRaw = getMilestoneEnd(m);
    const end = endRaw ? new Date(endRaw) : FAR_FUTURE;
    if (endRaw) end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  });

  if (activeMilestone) return activeMilestone;

  const sortedByStartAsc = [...sorted].sort((a, b) => {
    const startA = getMilestoneStart(a)
      ? new Date(getMilestoneStart(a)!).getTime()
      : Infinity;
    const startB = getMilestoneStart(b)
      ? new Date(getMilestoneStart(b)!).getTime()
      : Infinity;
    return startA - startB;
  });

  const futureMilestones = sortedByStartAsc.filter((m) => {
    const startRaw = getMilestoneStart(m);
    if (!startRaw) return false;
    const start = new Date(startRaw);
    start.setHours(0, 0, 0, 0);
    return start > now;
  });

  if (futureMilestones.length > 0) return futureMilestones[0];
  return sortedByStartDesc[0] || null;
};

export interface MilestoneState {
  status: MilestoneStatus;
  raised: number;
  progress: number;
  urgency?: boolean;
}

export const computeMilestoneStates = (
  milestones: FundraisingMilestone[],
  fundraisingTotal: number,
): Record<string, MilestoneState> => {
  const states: Record<string, MilestoneState> = {};
  const now = new Date();
  let cumulativeGoalPrevious = 0;
  const sorted = sortMilestonesByStartDate(milestones);

  for (let i = 0; i < sorted.length; i++) {
    const milestone = sorted[i];
    const goal = getMilestoneGoal(milestone);
    const cumulativeGoalThis = cumulativeGoalPrevious + goal;
    const startRaw = getMilestoneStart(milestone);
    const endRaw = getMilestoneEnd(milestone);
    const start = startRaw ? new Date(startRaw) : null;
    const end = endRaw ? new Date(endRaw) : null;
    if (end) end.setHours(23, 59, 59, 999);
    if (start) start.setHours(0, 0, 0, 0);

    const isCompleted = goal > 0 && fundraisingTotal >= cumulativeGoalThis;
    const isInDateRange =
      start && end
        ? now >= start && now <= end
        : start
          ? now >= start
          : false;
    const isFuture = start ? now < start : false;
    const isActiveByAmount =
      fundraisingTotal >= cumulativeGoalPrevious &&
      fundraisingTotal < cumulativeGoalThis;
    const isActive = isInDateRange && isActiveByAmount && !isCompleted;
    const raisedInPhase = Math.min(
      Math.max(0, fundraisingTotal - cumulativeGoalPrevious),
      goal,
    );
    const progress =
      goal > 0
        ? Math.min(
            100,
            (Math.max(0, fundraisingTotal - cumulativeGoalPrevious) / goal) *
              100,
          )
        : 0;
    const urgency =
      !isCompleted &&
      end !== null &&
      now <= end &&
      fundraisingTotal < cumulativeGoalThis;

    if (isCompleted) {
      states[milestone.id] = {
        status: 'completed',
        raised: goal,
        progress: 100,
        urgency: false,
      };
    } else if (isActive) {
      states[milestone.id] = {
        status: 'active',
        raised: raisedInPhase,
        progress,
        urgency,
      };
    } else if (isFuture) {
      states[milestone.id] = {
        status: 'pending',
        raised: 0,
        progress: 0,
        urgency: false,
      };
    } else {
      states[milestone.id] = {
        status: 'pending',
        raised: raisedInPhase,
        progress,
        urgency,
      };
    }
    cumulativeGoalPrevious = cumulativeGoalThis;
  }

  return states;
};

export interface FundraisingBreakdown {
  totalRaised: number;
  cryptoTotal: number;
  fiatTotal: number;
}

export const fetchFundraisingBreakdown = async (
  fundraisingConfig: FundraisingConfig | undefined,
): Promise<FundraisingBreakdown> => {
  const [cryptoRes, fiatRes] = await Promise.all([
    api
      .get('/sum/charge/amount.total.val', {
        params: {
          where: formatSearch({
            type: 'tokenSale',
            status: 'paid',
          }),
        },
      })
      .catch(() => null),
    api
      .get('/sum/charge/amount.total.val', {
        params: {
          where: formatSearch({
            type: 'fiatTokenSale',
            status: 'paid',
          }),
        },
      })
      .catch(() => null),
  ]);
  const cryptoTotal = Number(cryptoRes?.data?.sum ?? 0);
  const fiatTotal = Number(fiatRes?.data?.sum ?? 0);
  const preCampaign = Number(fundraisingConfig?.amountRaisedPreCampaign ?? 0);
  const loans = Number(fundraisingConfig?.loansCollectedTotal ?? 0);
  const totalRaised =
    preCampaign + loans + cryptoTotal + fiatTotal;
  return { totalRaised, cryptoTotal, fiatTotal };
};
