import {
  FundraisingMilestone,
  MilestoneStatus,
} from '../types/api';
import { Charge } from '../types/booking';
import api, { formatSearch } from './api';
import { formatIsoFiatAmount } from './currencyFormat';
import { mergeSaleListWhere, type SaleCategory } from './saleCategory';

export const FUNDRAISING_CHARGE_TYPES = [
  'tokenSale',
  'fiatTokenSale',
  'financedToken',
  'subscription',
  'donation',
] as const satisfies readonly Charge['type'][];

export const getMilestoneStart = (m: FundraisingMilestone): string | null =>
  m.start ?? m.startDate ?? null;
export const getMilestoneEnd = (m: FundraisingMilestone): string | null =>
  m.end ?? m.endDate ?? null;
export const getMilestoneGoal = (m: FundraisingMilestone): number =>
  Number(m.goal ?? m.targetAmount) || 0;

type MilestoneDateBoundary = 'start' | 'end';

const normalizeMilestoneBoundary = (
  date: Date,
  boundary: MilestoneDateBoundary,
): Date => {
  const normalized = new Date(date);
  if (boundary === 'start') {
    normalized.setHours(0, 0, 0, 0);
  } else {
    normalized.setHours(23, 59, 59, 999);
  }
  return normalized;
};

export const parseFundraisingMilestoneDate = (
  raw: string | null | undefined,
  boundary: MilestoneDateBoundary = 'start',
): Date | null => {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const date = new Date(year, month, day);
    if (Number.isNaN(date.getTime())) return null;
    return normalizeMilestoneBoundary(date, boundary);
  }

  const dayFirstMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (dayFirstMatch) {
    const day = Number(dayFirstMatch[1]);
    const month = Number(dayFirstMatch[2]) - 1;
    const year = Number(dayFirstMatch[3]);
    const date = new Date(year, month, day);
    if (Number.isNaN(date.getTime())) return null;
    return normalizeMilestoneBoundary(date, boundary);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return normalizeMilestoneBoundary(parsed, boundary);
};

const toCampaignDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatMilestoneDateLabel = (
  raw: string | null | undefined,
  locale?: string,
): string | null => {
  const date = parseFundraisingMilestoneDate(raw, 'start');
  if (!date) return null;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatMilestoneDateRange = (
  milestone: FundraisingMilestone,
  locale?: string,
): string | null => {
  const start = formatMilestoneDateLabel(getMilestoneStart(milestone), locale);
  const end = formatMilestoneDateLabel(getMilestoneEnd(milestone), locale);
  if (start && end) return `${start} – ${end}`;
  return start || end;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** How close a milestone deadline has to be before the urgency banner shows. */
export const MILESTONE_URGENCY_WINDOW_DAYS = 14;

export const getMilestoneDaysLeft = (
  milestone: FundraisingMilestone | null | undefined,
): number => {
  if (!milestone) return 0;
  const end = parseFundraisingMilestoneDate(getMilestoneEnd(milestone), 'end');
  if (!end) return 0;
  const diffMs = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / MS_PER_DAY));
};

export const getMilestoneCumulativeGoalBefore = (
  milestones: FundraisingMilestone[],
  milestone: FundraisingMilestone,
): number => {
  const sorted = sortMilestonesByStartDate(milestones);
  const index = sorted.findIndex((m) => m.id === milestone.id);
  if (index <= 0) return 0;
  return sorted
    .slice(0, index)
    .reduce((sum, m) => sum + getMilestoneGoal(m), 0);
};

export const findFundingMilestone = (
  milestones: FundraisingMilestone[] | undefined,
  fundraisingTotal: number,
): FundraisingMilestone | null => {
  if (!milestones?.length) return null;
  const sorted = sortMilestonesByStartDate(milestones);
  let cumulativeGoal = 0;
  for (const milestone of sorted) {
    cumulativeGoal += getMilestoneGoal(milestone);
    if (fundraisingTotal < cumulativeGoal) return milestone;
  }
  return sorted[sorted.length - 1] ?? null;
};

export const getMilestoneDisplayRaised = (
  milestones: FundraisingMilestone[],
  milestone: FundraisingMilestone,
  fundraisingTotal: number,
): number => {
  const cumulativePrevious = getMilestoneCumulativeGoalBefore(
    milestones,
    milestone,
  );
  const goal = getMilestoneGoal(milestone);
  const towardMilestone = Math.max(0, fundraisingTotal - cumulativePrevious);
  return Math.min(towardMilestone, goal);
};

const milestoneStartTime = (milestone: FundraisingMilestone): number =>
  parseFundraisingMilestoneDate(getMilestoneStart(milestone), 'start')?.getTime() ??
  0;

export const sortMilestonesByStartDate = (
  milestones: FundraisingMilestone[],
): FundraisingMilestone[] =>
  [...(milestones ?? [])].sort(
    (a, b) => milestoneStartTime(a) - milestoneStartTime(b),
  );

export const findActiveMilestone = (
  milestones: FundraisingMilestone[] | undefined,
): FundraisingMilestone | null => {
  if (!milestones || milestones.length === 0) return null;
  const sorted = sortMilestonesByStartDate(milestones);
  const now = new Date();
  const FAR_FUTURE = new Date('2100-01-01T00:00:00.000Z');

  const sortedByStartDesc = [...sorted].sort(
    (a, b) => milestoneStartTime(b) - milestoneStartTime(a),
  );

  const activeMilestone = sortedByStartDesc.find((m) => {
    const start = parseFundraisingMilestoneDate(getMilestoneStart(m), 'start');
    if (!start) return false;
    const end =
      parseFundraisingMilestoneDate(getMilestoneEnd(m), 'end') ?? FAR_FUTURE;
    return now >= start && now <= end;
  });

  if (activeMilestone) return activeMilestone;

  const sortedByStartAsc = [...sorted].sort(
    (a, b) => milestoneStartTime(a) - milestoneStartTime(b),
  );

  const futureMilestones = sortedByStartAsc.filter((m) => {
    const start = parseFundraisingMilestoneDate(getMilestoneStart(m), 'start');
    return start ? start > now : false;
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
    const start = parseFundraisingMilestoneDate(
      getMilestoneStart(milestone),
      'start',
    );
    const end = parseFundraisingMilestoneDate(getMilestoneEnd(milestone), 'end');

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
    // "Deadline approaching" should mean it actually is. Without the window
    // this was true for the whole life of every underfunded milestone.
    const daysToEnd =
      end === null
        ? null
        : Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY);
    const urgency =
      !isCompleted &&
      daysToEnd !== null &&
      daysToEnd >= 0 &&
      daysToEnd <= MILESTONE_URGENCY_WINDOW_DAYS &&
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

export const getCampaignStartDate = (
  milestones: FundraisingMilestone[] | undefined,
): string | null => {
  if (!milestones?.length) return null;
  const sorted = sortMilestonesByStartDate(milestones);
  const firstWithStart = sorted.find((m) => getMilestoneStart(m));
  if (!firstWithStart) return null;
  const parsed = parseFundraisingMilestoneDate(
    getMilestoneStart(firstWithStart),
    'start',
  );
  if (!parsed) return null;
  return toCampaignDateString(parsed);
};

export const buildCampaignChargeDateWhere = (
  startDate: string | null,
): Record<string, unknown> => {
  if (!startDate) return {};
  return { date: { $gte: startDate } };
};

const parseCountResponse = (data: unknown): number => {
  if (!data || typeof data !== 'object') return 0;
  const payload = data as { count?: number; results?: number | unknown[] };
  if (typeof payload.count === 'number') return payload.count;
  if (typeof payload.results === 'number') return payload.results;
  if (Array.isArray(payload.results)) return payload.results.length;
  return 0;
};

const paidChargeWhere = (
  type: Charge['type'],
  dateWhere: Record<string, unknown>,
) => ({
  type,
  status: 'paid',
  ...dateWhere,
});

// `/sum/:model/:field` answers `{ results: <number> }` like every other CRUD
// aggregate — there is no `sum` key.
const parseSumResponse = (data: unknown): number => {
  const value = Number((data as { results?: unknown })?.results ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const sumPaidChargesByType = async (
  type: Charge['type'],
  dateWhere: Record<string, unknown>,
): Promise<number> => {
  const res = await api
    .get('/sum/charge/amount.total.val', {
      params: {
        where: paidChargeWhere(type, dateWhere),
      },
    })
    .catch(() => null);
  return parseSumResponse(res?.data);
};

const countPaidChargesByType = async (
  type: Charge['type'],
  dateWhere: Record<string, unknown>,
): Promise<number> => {
  const res = await api
    .get('/count/charge', {
      params: {
        where: paidChargeWhere(type, dateWhere),
      },
    })
    .catch(() => null);
  return parseCountResponse(res?.data);
};

const withCampaignSaleCreated = (
  where: Record<string, unknown>,
  campaignStart: string | null,
): Record<string, unknown> => {
  if (!campaignStart) return where;
  const createdClause = { created: { $gte: campaignStart } };
  if (Array.isArray(where.$and)) {
    return { $and: [...where.$and, createdClause] };
  }
  return { $and: [where, createdClause] };
};

const sumPaidSalesForCategory = async (
  category: Extract<SaleCategory, 'tokens' | 'donations'>,
  campaignStart: string | null,
): Promise<number> => {
  const where = withCampaignSaleCreated(
    mergeSaleListWhere(category, 'paid'),
    campaignStart,
  );

  for (const field of ['total_price', 'price']) {
    const res = await api
      .get(`/sum/sale/${field}`, {
        params: { where },
      })
      .catch(() => null);
    const sum = parseSumResponse(res?.data);
    if (sum > 0) return sum;
  }

  const res = await api
    .get('/sale', {
      params: {
        where: formatSearch(where),
        limit: 500,
      },
    })
    .catch(() => null);
  const results = res?.data?.results;
  if (!Array.isArray(results)) return 0;
  return results.reduce((acc: number, sale: Record<string, unknown>) => {
    const chargeAmount = sale?.charge as
      | { amount?: { total?: { val?: number } } }
      | undefined;
    const fromCharge = chargeAmount?.amount?.total?.val;
    const value =
      typeof fromCharge === 'number' && Number.isFinite(fromCharge)
        ? fromCharge
        : Number(sale?.total_price ?? sale?.price ?? 0);
    return acc + (Number.isFinite(value) ? value : 0);
  }, 0);
};

const countPaidSalesForCategory = async (
  category: Extract<SaleCategory, 'tokens' | 'donations'>,
  campaignStart: string | null,
): Promise<number> => {
  const where = withCampaignSaleCreated(
    mergeSaleListWhere(category, 'paid'),
    campaignStart,
  );
  const res = await api
    .get('/count/sale', {
      params: { where },
    })
    .catch(() => null);
  return parseCountResponse(res?.data);
};

export const formatFundraiserAmount = (
  amount: number,
  locale?: string,
): string =>
  formatIsoFiatAmount(amount, 'EUR', locale, { min: 0, max: 0 });

export interface FundraisingBreakdown {
  totalRaised: number;
  chargesTotal: number;
  cryptoTotal: number;
  fiatTotal: number;
  donationTotal: number;
  financedTotal: number;
  subscriptionTotal: number;
  preCampaignTotal: number;
  loansTotal: number;
  donorCount: number;
}

export type FundraisingTotalsInput = {
  amountRaisedPreCampaign?: number | string;
  loansCollectedTotal?: number | string;
  milestones?: FundraisingMilestone[];
};

export const fetchFundraisingBreakdown = async (
  totals?: FundraisingTotalsInput,
): Promise<FundraisingBreakdown> => {
  const campaignStart = getCampaignStartDate(totals?.milestones);
  const chargeDateWhere = buildCampaignChargeDateWhere(campaignStart);

  const [
    cryptoTotal,
    fiatTotal,
    donationChargeTotal,
    donationSalesTotal,
    tokenSalesTotal,
    financedTotal,
    subscriptionTotal,
    donationSaleCount,
    tokenSaleCount,
    financedCount,
    subscriptionCount,
  ] = await Promise.all([
    sumPaidChargesByType('tokenSale', chargeDateWhere),
    sumPaidChargesByType('fiatTokenSale', chargeDateWhere),
    sumPaidChargesByType('donation', chargeDateWhere),
    sumPaidSalesForCategory('donations', campaignStart),
    sumPaidSalesForCategory('tokens', campaignStart),
    sumPaidChargesByType('financedToken', chargeDateWhere),
    sumPaidChargesByType('subscription', chargeDateWhere),
    countPaidSalesForCategory('donations', campaignStart),
    countPaidSalesForCategory('tokens', campaignStart),
    countPaidChargesByType('financedToken', chargeDateWhere),
    countPaidChargesByType('subscription', chargeDateWhere),
  ]);

  const preCampaign = Number(totals?.amountRaisedPreCampaign ?? 0);
  const loans = Number(totals?.loansCollectedTotal ?? 0);
  const tokensFromCharges = cryptoTotal + fiatTotal;
  const tokenTotal =
    tokensFromCharges > 0 ? tokensFromCharges : tokenSalesTotal;
  const donationTotal =
    donationSalesTotal > 0 ? donationSalesTotal : donationChargeTotal;
  const chargesTotal =
    tokenTotal + donationTotal + financedTotal + subscriptionTotal;
  const totalRaised = preCampaign + loans + chargesTotal;
  const donorCount =
    donationSaleCount + tokenSaleCount + financedCount + subscriptionCount;

  return {
    totalRaised,
    chargesTotal,
    cryptoTotal,
    fiatTotal,
    donationTotal,
    financedTotal,
    subscriptionTotal,
    preCampaignTotal: preCampaign,
    loansTotal: loans,
    donorCount,
  };
};

export type FundraisingBubbleMessage = {
  key: string;
  values?: Record<string, string | number>;
};

/** Descending, so the highest milestone crossed (or approached) wins. */
const BUBBLE_PERCENT_THRESHOLDS = [90, 75, 50, 25];

/** How many points below a threshold still counts as "almost". */
const BUBBLE_ALMOST_MARGIN = 5;

/**
 * Picks the nav tooltip copy from where the campaign actually is, so the bubble
 * says something useful rather than the same generic line every time.
 *
 * Deadline pressure outruns progress: with two days to go, "2 days left" is a
 * better prompt than "over 75% funded", however good the number looks.
 */
export const getFundraisingBubbleMessage = ({
  isGoalReached,
  progressPercent,
  daysLeft,
  isLoading,
}: {
  isGoalReached: boolean;
  progressPercent: number;
  daysLeft: number;
  isLoading?: boolean;
}): FundraisingBubbleMessage => {
  // Until the totals land, progressPercent is 0 and would read as "just started".
  if (isLoading) return { key: 'invest_bubble_fundraising' };

  if (isGoalReached) return { key: 'invest_bubble_goal_reached' };

  if (daysLeft > 0 && daysLeft <= 3) {
    return { key: 'invest_bubble_days_left', values: { days: daysLeft } };
  }
  if (daysLeft === 0) return { key: 'invest_bubble_last_day' };

  const pct = Math.floor(progressPercent);
  if (pct >= 90) return { key: 'invest_bubble_almost_there' };

  // Approaching a round number is worth saying out loud: at 48% "almost 50%"
  // lands better than "over 25%", which undersells where the campaign is.
  for (const threshold of BUBBLE_PERCENT_THRESHOLDS) {
    if (pct < threshold && pct >= threshold - BUBBLE_ALMOST_MARGIN) {
      return {
        key: 'invest_bubble_almost_percent',
        values: { percent: threshold },
      };
    }
  }

  for (const threshold of BUBBLE_PERCENT_THRESHOLDS) {
    if (pct >= threshold) {
      return { key: 'invest_bubble_over_percent', values: { percent: threshold } };
    }
  }

  return { key: 'invest_bubble_fundraising' };
};
