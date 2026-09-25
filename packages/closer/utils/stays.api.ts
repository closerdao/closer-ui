import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import utc from 'dayjs/plugin/utc';
import { BigNumber, utils as ethersUtils } from 'ethers';

import type {
  BookingPaymentDelta,
  OffPlatformChargeMethod,
  UpdatedPrices,
  VolunteerInfo,
} from '../types/booking';
import { CloserCurrencies } from '../types/currency';
import type { StaySearchResponse } from '../types/durationDiscount';
import type {
  AutoCancelExemptStay,
  BackendTokenStakePlan,
  HostChangesPage,
  HostNote,
  PendingModification,
  PriceLock,
  Stay,
  StayCheckoutResponse,
  StayModificationRefund,
  StayModificationRequest,
  StayMoney,
  StayPaymentMethod,
  StayQuoteResponse,
  StayStatus,
  StayStripeIntent,
  StayTokenPaymentConfirmResponse,
  StayTokenPaymentQuote,
  StayTokenStakePlan,
  StayTokenStakeSegment,
  StayTokenStakeSubmission,
} from '../types/stay';
import api from './api';
import { priceFormat } from './helpers';

dayjs.extend(utc);
dayjs.extend(dayOfYear);

const utcCalendarDayFromStayDate = (input: string): dayjs.Dayjs => {
  const trimmed = input.trim();
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (dateOnly) {
    return dayjs.utc(dateOnly[1], 'YYYY-MM-DD', true).startOf('day');
  }
  return dayjs.utc(trimmed).startOf('day');
};

export const getStayAccommodationNightCount = (stay: Stay): number => {
  if (stay.start && stay.end) {
    const startDay = utcCalendarDayFromStayDate(stay.start);
    const endDay = utcCalendarDayFromStayDate(stay.end);
    if (startDay.isValid() && endDay.isValid()) {
      const nights = endDay.diff(startDay, 'day');
      if (Number.isFinite(nights) && nights > 0) return nights;
    }
  }
  return stay.duration || 0;
};

export const formatStayMoney = (
  money: StayMoney | undefined | null,
): string => {
  if (!money) return '';
  return priceFormat(money.val, money.cur as CloserCurrencies);
};

export const tokenBalanceToRequestedWei = (
  balance: string | number,
  decimals = 18,
): string => {
  const raw = String(balance ?? '0').trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) return '0';
  const [whole, fraction = ''] = raw.split('.');
  const normalized = fraction.length
    ? `${whole}.${fraction.slice(0, Math.max(0, decimals))}`
    : whole;
  try {
    return ethersUtils.parseUnits(normalized, decimals).toString();
  } catch {
    return '0';
  }
};

export const getCreditsBalance = async (): Promise<number> => {
  try {
    const { data } = await api.get('/credits/balance', { cache: false } as any);
    const raw = data?.results;
    const num = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(num) ? num : 0;
  } catch {
    return 0;
  }
};

export const checkCreditsAvailability = async ({
  startDate,
  creditsAmount,
  minCreditsAmount,
}: {
  startDate: string | Date;
  creditsAmount: number;
  minCreditsAmount: number;
}): Promise<boolean> => {
  try {
    const { data } = await api.post('/credits/availability', {
      startDate,
      creditsAmount,
      minCreditsAmount,
    });
    return Boolean(data?.results);
  } catch {
    return false;
  }
};

export const getStayTokenPricePerNight = (stay: Stay): number => {
  const daily = stay.priceLock?.dailyRentalToken?.val;
  if (daily != null && Number.isFinite(daily) && daily > 0) {
    return daily;
  }
  const nights = getStayAccommodationNightCount(stay);
  const total = getStayAccommodationTokenTotal(stay);
  if (!nights || !total) {
    return 0;
  }
  return total / nights;
};

export const STAY_TERMINAL_STATUSES: ReadonlyArray<StayStatus> = [
  'cancelled',
  'rejected',
];

export const isStayTerminal = (
  stayOrStatus: Pick<Stay, 'status'> | StayStatus | null | undefined,
): boolean => {
  if (stayOrStatus == null) return false;
  const status =
    typeof stayOrStatus === 'string' ? stayOrStatus : stayOrStatus.status;
  return STAY_TERMINAL_STATUSES.includes(status);
};

export const isStayPaid = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => stay?.status === 'paid';

export const isStayAwaitingPayment = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean =>
  stay?.status === 'confirmed' || stay?.status === 'pending-payment';

export const isStayCollectingRemainingFiat = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => {
  const status = stay?.status;
  return (
    status === 'confirmed' ||
    status === 'pending-payment' ||
    status === 'tokens-staked' ||
    status === 'credits-paid'
  );
};

function normalizeStayStatusRaw(
  status: Stay['status'] | null | undefined,
): string {
  if (status == null) return '';
  if (typeof status !== 'string') return '';
  return status.trim().toLowerCase();
}

export const isStayCheckoutDraft = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => normalizeStayStatusRaw(stay?.status) === 'draft';

export const isStayAwaitingHostApproval = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => normalizeStayStatusRaw(stay?.status) === 'pending';

export const canApplyTokenOrCreditsToStay = (
  stay: Pick<Stay, 'status'> | null | undefined,
): boolean => {
  const s = normalizeStayStatusRaw(stay?.status);
  if (!s) return false;
  if (s === 'draft' || s === 'pending' || s === 'paid') return false;
  if ((STAY_TERMINAL_STATUSES as readonly string[]).includes(s)) return false;
  return s === 'confirmed' || s === 'pending-payment';
};

export const isVolunteerStay = (
  stay: Pick<Stay, 'volunteerInfo'> | null | undefined,
): boolean => {
  const bookingType = stay?.volunteerInfo?.bookingType;
  return bookingType === 'volunteer' || bookingType === 'residence';
};

export const canShowStayTokenCreditPaymentOptions = (
  stay:
    | Pick<Stay, 'status' | 'volunteerInfo' | 'residencyAgreementId'>
    | null
    | undefined,
  isMember: boolean,
): boolean => {
  if (!stay) return false;
  /*
   * A volunteer season's stay is the exception to the rule below: its
   * `tokensTarget` is the association's own figure for the room upgrade, and
   * the server verifies the stake against it rather than the listing price.
   * Offered once a space-host has countersigned (`confirmed`), never before.
   */
  if (stay.residencyAgreementId) return canApplyTokenOrCreditsToStay(stay);
  // Accommodation is already 0 on a volunteer/residence stay, but the server
  // still stakes tokens/credits off the listing price — so never offer them.
  if (isVolunteerStay(stay)) return false;
  if (isStayCheckoutDraft(stay)) {
    return Boolean(isMember);
  }
  if (!canApplyTokenOrCreditsToStay(stay)) return false;
  return (
    Boolean(isMember) || normalizeStayStatusRaw(stay.status) === 'confirmed'
  );
};

export const computeFiatOwed = (stay?: Stay | null): number => {
  if (!stay) return 0;
  const target = stay.fiatTarget?.val ?? stay.priceLock?.total?.val ?? 0;
  const paid = stay.fiatPaid?.val ?? 0;
  return Math.max(0, target - paid);
};

export const computeFiatOwedMoney = (stay?: Stay | null): StayMoney => ({
  val: computeFiatOwed(stay),
  cur:
    stay?.fiatTarget?.cur ??
    stay?.priceLock?.total?.cur ??
    CloserCurrencies.EUR,
});

export const computeCreditsOwed = (stay?: Stay | null): number => {
  if (!stay) return 0;
  const target = stay.creditsTarget?.val ?? 0;
  const paid = stay.creditsPaid?.val ?? 0;
  return Math.max(0, target - paid);
};

export const computeTokensOwed = (stay?: Stay | null): number => {
  if (!stay) return 0;
  const target = stay.tokensTarget?.val ?? 0;
  const staked = stay.tokensStaked?.val ?? 0;
  const raw = Math.max(0, target - staked);
  if (!Number.isFinite(raw)) return 0;
  return Math.round(raw * 1e6) / 1e6;
};

export function getStayAccommodationGuestMultiplier(stay: {
  adults?: number;
  children?: number;
}): number {
  const adultsRaw = Number(stay.adults ?? 0);
  const childrenRaw = Number(stay.children ?? 0);
  const adults = Number.isFinite(adultsRaw) ? adultsRaw : 0;
  const children = Number.isFinite(childrenRaw) ? childrenRaw : 0;
  return Math.max(1, adults + children);
}

export const getStayAccommodationTokenTotal = (stay: Stay): number => {
  /*
   * A volunteer season's stay owes exactly `tokensTarget` — what the
   * volunteer chose to stake against a room above the covered one — and the
   * server verifies each night on chain against `tokensTarget / nights`.
   * `rentalToken` is 0 on every team booking and `dailyRentalToken` is the
   * listing's full nightly rate copied from the price lock, so reading either
   * would size the stake off the wrong number.
   */
  if (stay.residencyAgreementId) {
    const target = Number(stay.tokensTarget?.val ?? 0);
    return Number.isFinite(target) && target > 0 ? target : 0;
  }
  const rentalVal = stay.rentalToken?.val;
  if (rentalVal != null && Number.isFinite(rentalVal) && rentalVal >= 0) {
    return rentalVal;
  }
  const nights = getStayAccommodationNightCount(stay);
  const daily = stay.priceLock?.dailyRentalToken?.val ?? 0;
  const guests = getStayAccommodationGuestMultiplier(stay);
  if (!nights || !daily) return 0;
  return nights * daily * guests;
};

const TDF_DECIMALS = 18;

/**
 * A volunteer season's stay is filed by `POST /residencies/apply` rather than
 * through the stay quote, so it carries the team booking's (zeroed) price lock
 * and no `tokenStakePlan` with it. The season's own figure is on the stay:
 * `tokensTarget`, which the server verifies each night against
 * `tokensTarget / nights`. Derived here only when the backend sent no plan —
 * a plan that does arrive stays authoritative, on a season as anywhere else.
 */
const buildResidencyTokenStakePlan = (
  stay: Stay,
): StayTokenStakePlan | null => {
  if (!stay.residencyAgreementId || !stay.start) return null;

  const nights = getStayAccommodationNightCount(stay);
  const total = getStayAccommodationTokenTotal(stay);
  if (nights <= 0 || total <= 0) return null;

  const startUtc = utcCalendarDayFromStayDate(stay.start);
  if (!startUtc.isValid()) return null;

  let totalWeiBn: BigNumber;
  try {
    totalWeiBn = ethersUtils.parseUnits(total.toFixed(6), TDF_DECIMALS);
  } catch {
    return null;
  }
  const nightsBn = BigNumber.from(nights);
  // Round the nightly price up, so the nights together never stake less than
  // the target the server checks against.
  const pricePerNightWei = totalWeiBn.add(nightsBn).sub(1).div(nightsBn);
  if (pricePerNightWei.isZero()) return null;
  const stakedWei = pricePerNightWei.mul(nightsBn);

  const bookingNights: number[][] = [];
  for (let i = 0; i < nights; i++) {
    const day = startUtc.add(i, 'day');
    if (!day.isValid()) return null;
    bookingNights.push([day.year(), day.dayOfYear()]);
  }

  return {
    segments: [
      { bookingNights, pricePerNightWei: pricePerNightWei.toString() },
    ],
    totalWei: stakedWei.toString(),
    decimals: TDF_DECIMALS,
    displayDecimals: 6,
    tokenAmount: Number(ethersUtils.formatUnits(stakedWei, TDF_DECIMALS)),
    bookingNights,
  };
};

const isStakeNight = (night: unknown): night is number[] =>
  Array.isArray(night) &&
  night.length === 2 &&
  night.every((part) => Number.isFinite(Number(part)));

const isStakePriceWei = (price: unknown): boolean =>
  price != null && /^\d+$/.test(String(price).trim());

/**
 * The backend's `segments` are the source of truth: an extension appends a
 * segment for the added nights at the marginal rate and leaves the locked
 * nights on their own. A plan written before segments existed carries one flat
 * rate for the whole stay; read it as a single segment. `null` rejects the
 * plan — a malformed segment would silently drop the nights it covers.
 */
const readBackendStakeSegments = (
  backendPlan: BackendTokenStakePlan,
): StayTokenStakeSegment[] | null => {
  if (backendPlan.segments != null) {
    if (!Array.isArray(backendPlan.segments) || !backendPlan.segments.length) {
      return null;
    }
    const segments: StayTokenStakeSegment[] = [];
    for (const segment of backendPlan.segments) {
      if (
        !Array.isArray(segment?.dates) ||
        !segment.dates.length ||
        !segment.dates.every(isStakeNight) ||
        !isStakePriceWei(segment.pricePerNightWei)
      ) {
        return null;
      }
      segments.push({
        bookingNights: segment.dates,
        pricePerNightWei: String(segment.pricePerNightWei).trim(),
      });
    }
    return segments;
  }
  if (
    backendPlan.dates?.length &&
    backendPlan.dates.every(isStakeNight) &&
    isStakePriceWei(backendPlan.pricePerNightWei)
  ) {
    return [
      {
        bookingNights: backendPlan.dates,
        pricePerNightWei: String(backendPlan.pricePerNightWei).trim(),
      },
    ];
  }
  return [];
};

export const buildStayTokenStakePlan = (
  stay: Stay,
  _tokensToStakeTotal?: number,
): StayTokenStakePlan | null => {
  // While a change is held, the nights to sign are the proposed ones, not the
  // confirmed stay's.
  const backendPlan =
    stay.pendingModification?.quote?.priceLockPreview?.tokenStakePlan ??
    stay.priceLock?.tokenStakePlan;
  const segments = backendPlan ? readBackendStakeSegments(backendPlan) : [];
  if (!segments) return null;
  if (!backendPlan || !segments.length) {
    return buildResidencyTokenStakePlan(stay);
  }

  const decimals = Number.isInteger(backendPlan.decimals)
    ? backendPlan.decimals
    : 18;
  const displayDecimals = Number.isInteger(backendPlan.displayDecimals)
    ? Math.min(6, Math.max(0, backendPlan.displayDecimals))
    : 6;
  let totalWei: string;
  try {
    totalWei = backendPlan.totalWei
      ? BigNumber.from(backendPlan.totalWei).toString()
      : segments
          .reduce(
            (sum, segment) =>
              sum.add(
                BigNumber.from(segment.pricePerNightWei).mul(
                  segment.bookingNights.length,
                ),
              ),
            BigNumber.from(0),
          )
          .toString();
  } catch {
    return null;
  }
  const tokenAmount = Number(
    backendPlan.total?.val ?? ethersUtils.formatUnits(totalWei, decimals),
  );
  if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) {
    return null;
  }

  return {
    segments,
    totalWei,
    decimals,
    displayDecimals,
    tokenAmount,
    bookingNights: segments.flatMap((segment) => segment.bookingNights),
  };
};

const stakeNightUtc = ([year, day]: number[]): dayjs.Dayjs =>
  dayjs.utc(`${year}-01-01`).dayOfYear(day);

// Mirrors BookingFacet's `timestamp > block.timestamp`: a night whose UTC day has started reverts.
const isStakeNightInFuture = (night: number[], now: number): boolean =>
  stakeNightUtc(night).valueOf() > now;

export const formatStakeNights = (nights: number[][]): string =>
  nights.map((night) => stakeNightUtc(night).format('MMM D')).join(', ');

/** Unstaked nights of the plan the contract would reject as already past. */
export const listPastUnstakedNights = (
  plan: StayTokenStakePlan,
  stakedNightCount: number,
  now: number = Date.now(),
): number[][] =>
  plan.bookingNights
    .slice(Math.max(0, Math.floor(stakedNightCount) || 0))
    .filter((night) => !isStakeNightInFuture(night, now));

// One contract call carries one nightly price, so a batch never spans segments.
export const selectStayTokenStakeSubmission = (
  plan: StayTokenStakePlan | null | undefined,
  stakedNightCount = 0,
  now: number = Date.now(),
): StayTokenStakeSubmission | null => {
  if (!plan) return null;
  const staked = Math.max(0, Math.floor(stakedNightCount) || 0);
  let segmentStart = 0;
  for (const segment of plan.segments) {
    const segmentEnd = segmentStart + segment.bookingNights.length;
    const bookingNights = segment.bookingNights
      .slice(Math.max(0, staked - segmentStart))
      .filter((night) => isStakeNightInFuture(night, now));
    if (bookingNights.length) {
      return {
        bookingNights,
        pricePerNightWei: segment.pricePerNightWei,
        stakedNightCountAfter: segmentEnd,
      };
    }
    segmentStart = segmentEnd;
  }
  return null;
};

export const accommodationTokenTotalFromPriceLock = (
  priceLock:
    | {
        rentalToken?: { val: number } | null;
        dailyRentalToken?: { val: number } | null;
      }
    | null
    | undefined,
  duration: number,
  adults: number,
  listingIsPrivate?: boolean | null,
): number => {
  const lockedTotal = Number(priceLock?.rentalToken?.val);
  if (Number.isFinite(lockedTotal) && lockedTotal >= 0) return lockedTotal;
  const dailyVal = priceLock?.dailyRentalToken?.val;
  if (
    dailyVal == null ||
    !Number.isFinite(Number(dailyVal)) ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return 0;
  }
  // Legacy price locks stored a per-guest daily value. Modern locks expose
  // rentalToken above and never enter this compatibility fallback.
  const guestMult = listingIsPrivate ? 1 : Math.max(1, adults);
  return Number((Number(dailyVal) * duration * guestMult).toFixed(6));
};

export const canChangeStayPaymentMethod = (stay: Stay): boolean => {
  // The targets on a volunteer season's stay are the agreement's frozen
  // program; the server refuses to rewrite them from the (zero) team price
  // lock, so a method switch would change nothing but the volunteer's idea of
  // what they owe.
  if (stay.residencyAgreementId) return false;
  if (isStayTerminal(stay)) return false;
  if (isStayAwaitingHostApproval(stay)) return false;
  if ((stay.creditsPaid?.val ?? 0) > 0) return false;
  if ((stay.tokensStaked?.val ?? 0) > 0) return false;
  return true;
};

export const canAugmentTokenOrCreditsPayment = (stay: Stay): boolean => {
  if (!isStayAwaitingPayment(stay)) return false;
  return computeTokensOwed(stay) > 0.005 || computeCreditsOwed(stay) > 0.005;
};

export const inferPaymentChoiceFromStay = (
  stay: Stay,
  totalAccommodationTokens?: number,
  opts?: { listingPrivate?: boolean | null },
): StayPaymentMethod => {
  const fullTokenAccommodation =
    totalAccommodationTokens ??
    (stay.priceLock?.dailyRentalToken?.val
      ? accommodationTokenTotalFromPriceLock(
          stay.priceLock,
          stay.duration || 0,
          stay.adults ?? 1,
          opts?.listingPrivate,
        )
      : 0);
  const tokensTarget = stay.tokensTarget?.val ?? stay.appliedTokens?.val ?? 0;
  const creditsTarget =
    stay.creditsTarget?.val ?? stay.appliedCredits?.val ?? 0;
  if (
    fullTokenAccommodation > 0 &&
    tokensTarget > 0 &&
    tokensTarget >= fullTokenAccommodation
  ) {
    return 'full-tokens';
  }
  if (tokensTarget > 0) return 'partial-tokens';
  if (
    fullTokenAccommodation > 0 &&
    creditsTarget > 0 &&
    creditsTarget >= fullTokenAccommodation
  ) {
    return 'full-credits';
  }
  if (creditsTarget > 0) return 'partial-credits';
  return 'fiat';
};

export const stayUsesTokenAccommodation = (stay: Stay): boolean => {
  if (stay.useTokens === true) return true;
  const tokenAccommodationVal = getStayAccommodationTokenTotal(stay);
  const choice = inferPaymentChoiceFromStay(stay, tokenAccommodationVal);
  return choice === 'full-tokens' || choice === 'partial-tokens';
};

type ApiOk<T> = { results: T };

export type StayBookingType = 'volunteer' | 'residence';

export type StaySearchPayload = {
  start: string;
  end: string;
  adults: number;
  children?: number;
  eventId?: string | null;
  /**
   * Classifies the stay server-side (stored as volunteerInfo.bookingType) and
   * restricts results to listings whose availableFor covers it. Replaces the
   * deprecated volunteerId.
   */
  bookingType?: StayBookingType | null;
  isFriendsBooking?: boolean;
  /**
   * Team stays ignore event calendar blocks, so without it the search greys out
   * dates POST /stays accepts. Role-gated server-side (space-host, steward,
   * land manager, team, admin) — everyone else gets the regular calendar back.
   */
  isTeamBooking?: boolean;
};

export const searchStays = async (
  payload: StaySearchPayload,
): Promise<StaySearchResponse> => {
  const { data } = await api.post('/stays/search', payload);
  return data as StaySearchResponse;
};

export const checkStayListingAvailability = async (
  listingId: string,
  payload: {
    start: string;
    end: string;
    adults: number;
    /**
     * Required for volunteer stays: without it the calendar greys out days that
     * POST /stays accepts, because volunteer stays ignore event calendar blocks
     * and use the volunteering minimum stay.
     */
    bookingType?: StayBookingType | null;
    /**
     * Same story as volunteer stays for a stay booked for the team: the block is
     * ignored by POST /stays, so the calendar has to ignore it too. Role-gated
     * server-side and ignored for anyone else.
     */
    isTeamBooking?: boolean;
    isFriendsBooking?: boolean;
    eventId?: string | null;
  },
): Promise<{
  results: boolean;
  availability: any[];
  availabilityReason: string | null;
}> => {
  const { data } = await api.post(
    `/stays/listing/${listingId}/availability`,
    payload,
  );
  return data;
};

export type CreateStayPayload = {
  /** Required except for day tickets, which reserve no space. */
  listingId?: string;
  start: string;
  end: string;
  adults: number;
  children?: number;
  infants?: number;
  pets?: number;
  isHourlyBooking?: boolean;
  isDayTicket?: boolean;
  isFriendsBooking?: boolean;
  friendEmails?: string;
  /**
   * Co-guest user ids. Only settable at creation: a draft stay rejects edits,
   * and afterwards the list moves through addStayGuest/removeStayGuest.
   */
  guests?: string[];
  eventId?: string | null;
  /**
   * Shorthand the server folds into volunteerInfo when there are no application
   * details to send. Prefer the full volunteerInfo when there are.
   */
  bookingType?: StayBookingType | null;
  volunteerInfo?: VolunteerInfo;
  isTeamBooking?: boolean;
  ticketOption?: string | null;
  eventDiscount?: string | null;
  foodOption?: string;
  foodOptionId?: string | null;
  doesNeedPickup?: boolean;
  doesNeedSeparateBeds?: boolean;
  parentBookingId?: string | null;
};

export const createStay = async (payload: CreateStayPayload): Promise<Stay> => {
  const { data } = await api.post('/stays', payload);
  return (data as ApiOk<Stay>).results;
};

export const getStay = async (id: string): Promise<Stay> => {
  const { data } = await api.get(`/stays/${id}`, { cache: false } as any);
  return (data as ApiOk<Stay>).results;
};

export type CreateAdminStayPayload = {
  listingId: string;
  start: string;
  end: string;
  adults: number;
  adminBookingReason?: string;
  isTeamBooking?: boolean;
};

/**
 * Host-only manual booking. The server zeroes the payment targets, so the stay
 * lands on 'paid' without going through checkout.
 */
export const createAdminStay = async (
  payload: CreateAdminStayPayload,
): Promise<Stay> => {
  const { data } = await api.post('/stays/admin', payload);
  return unwrapStayMutationResult(data);
};

const zeroStayMoney = (money: StayMoney): StayMoney => ({
  val: 0,
  cur: money.cur,
});

export const applyOptimisticTeamBookingToStay = (
  stay: Stay,
  isTeamBooking: boolean,
  previousPriceLock?: PriceLock | null,
): Stay => {
  if (!isTeamBooking) {
    if (!previousPriceLock) {
      return { ...stay, isTeamBooking: false };
    }
    return {
      ...stay,
      isTeamBooking: false,
      priceLock: previousPriceLock,
      fiatTarget: {
        val: previousPriceLock.total.val,
        cur: previousPriceLock.total.cur,
      },
    };
  }

  if (!stay.priceLock) {
    return { ...stay, isTeamBooking: true };
  }

  const priceLock = stay.priceLock;
  const waived =
    priceLock.lines.accommodation.val +
    priceLock.lines.food.val +
    priceLock.lines.utility.val;
  const newSubtotal = Math.max(
    0,
    +(priceLock.subtotal.val - waived).toFixed(2),
  );
  const newTotal = Math.max(0, +(priceLock.total.val - waived).toFixed(2));

  return {
    ...stay,
    isTeamBooking: true,
    priceLock: {
      ...priceLock,
      lines: {
        ...priceLock.lines,
        accommodation: zeroStayMoney(priceLock.lines.accommodation),
        accommodationGross: zeroStayMoney(
          priceLock.lines.accommodationGross ?? priceLock.lines.accommodation,
        ),
        food: zeroStayMoney(priceLock.lines.food),
        utility: zeroStayMoney(priceLock.lines.utility),
      },
      subtotal: { ...priceLock.subtotal, val: newSubtotal },
      total: { ...priceLock.total, val: newTotal },
    },
    fiatTarget: stay.fiatTarget
      ? { ...stay.fiatTarget, val: newTotal }
      : { val: newTotal, cur: priceLock.total.cur },
  };
};

export type StayOptionsPayload = Partial<{
  foodOption: string;
  foodOptionId: string | null;
  doesNeedPickup: boolean;
  doesNeedSeparateBeds: boolean;
  isTeamBooking: boolean;
  message: string;
  gift: string;
  about: string;
  volunteerInfo: VolunteerInfo;
  ticketOption: string | null;
  eventDiscount: string | null;
}>;

export const updateStayOptions = async (
  id: string,
  payload: StayOptionsPayload,
): Promise<Stay> => {
  const { data } = await api.patch(`/stays/${id}/options`, payload);
  return (data as ApiOk<Stay>).results;
};

export type StayPaymentMethodPayload = {
  method: StayPaymentMethod;
  appliedCredits?: number;
  appliedTokens?: number;
  requestedTokensWei?: string;
};

export const setStayPaymentMethod = async (
  id: string,
  payload: StayPaymentMethodPayload,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/payment-method`, payload);
  return (data as ApiOk<Stay>).results;
};

export type StayQuotePayload = Partial<{
  duration: number;
  end: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  listingId: string;
  foodOption: string;
  foodOptionId: string | null;
  appliedCredits: number;
  appliedTokens: number;
  requestedTokensWei: string;
}>;

export const quoteStay = async (
  id: string,
  payload: StayQuotePayload,
): Promise<StayQuoteResponse> => {
  const { data } = await api.post(`/stays/${id}/quote`, payload);
  return (data as ApiOk<StayQuoteResponse>).results;
};

export function computeFiatDiscountFromStayQuote(
  stay: Stay,
  quote: StayQuoteResponse,
): { amount: number; cur: string } {
  const before = computeFiatOwed(stay);
  const deltaVal = Number(quote.delta?.fiat?.val ?? NaN);
  let after: number;
  if (Number.isFinite(deltaVal)) {
    after = Math.max(0, before + deltaVal);
  } else {
    const paid = stay.fiatPaid?.val ?? 0;
    const newTotalVal = Number(quote.priceLock?.total?.val ?? NaN);
    if (!Number.isFinite(newTotalVal)) {
      return { amount: 0, cur: 'EUR' };
    }
    after = Math.max(0, newTotalVal - paid);
  }
  const amount = Math.max(0, Math.round((before - after) * 100) / 100);
  const cur = String(
    quote.delta?.fiat?.cur ?? quote.priceLock?.total?.cur ?? 'EUR',
  );
  return { amount, cur };
}

export const submitStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/submit`, {});
  return (data as ApiOk<Stay>).results;
};

export const checkoutStay = async (
  id: string,
  paymentMethod?: string,
): Promise<StayCheckoutResponse> => {
  const trimmed = typeof paymentMethod === 'string' ? paymentMethod.trim() : '';
  const { data } = await api.post(
    `/stays/${id}/checkout`,
    trimmed ? { paymentMethod: trimmed } : {},
  );
  return (data as ApiOk<StayCheckoutResponse>).results;
};

export const confirmStayCheckout = async (
  id: string,
  paymentIntentId: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/checkout/confirm`, {
    paymentIntentId,
  });
  return (data as ApiOk<Stay>).results;
};

/**
 * Crypto rail for the fiat leg — alternative to the Stripe /checkout pair.
 * Empty body: re-verifies availability, pre-assigns beds and returns the
 * stablecoin transfer quote. Credits and token-stake legs are unaffected.
 */
export const quoteStayTokenPayment = async (
  id: string,
): Promise<StayTokenPaymentQuote> => {
  const { data } = await api.post(`/stays/${id}/token-payment`, {});
  return (data as ApiOk<StayTokenPaymentQuote>).results;
};

/**
 * Step 2: pass the hash of the client-side stablecoin transfer. Idempotent on
 * txHash (scoped per booking). A 400 "could not be verified" usually means the
 * explorer has not indexed the tx yet — see isStayTokenPaymentNotIndexedError.
 */
export const confirmStayTokenPayment = async (
  id: string,
  txHash: string,
): Promise<StayTokenPaymentConfirmResponse> => {
  const { data } = await api.post(`/stays/${id}/token-payment`, { txHash });
  const results = (data as ApiOk<{ booking?: Stay | null; verified?: boolean }>)
    ?.results;
  if (results?.booking) {
    return { booking: results.booking, verified: Boolean(results.verified) };
  }
  const booking = await getStay(id);
  return { booking, verified: Boolean(results?.verified) };
};

/** True for the 400 the server answers while the block explorer has not
 * indexed the transfer yet — safe to retry after a few seconds. */
export const isStayTokenPaymentNotIndexedError = (message: string): boolean =>
  /could not be verified/i.test(message);

export type StakeStayTokensOptions = {
  syncBookingAlreadyOnChain?: boolean;
};

export const stakeStayTokens = async (
  id: string,
  transactionId: string,
  options?: StakeStayTokensOptions,
): Promise<{ booking: Stay; verified: boolean }> => {
  const body: Record<string, unknown> =
    options?.syncBookingAlreadyOnChain === true
      ? { syncBookingAlreadyOnChain: true }
      : { transactionId };
  const { data } = await api.post(`/stays/${id}/token-stake`, body);
  const results = (data as ApiOk<{ booking?: Stay | null; verified?: boolean }>)
    ?.results;
  if (results?.booking) {
    return { booking: results.booking, verified: Boolean(results.verified) };
  }
  const booking = await getStay(id);
  return { booking, verified: Boolean(results?.verified) };
};

export const cancelStay = async (
  id: string,
): Promise<{ booking: Stay; refund: any }> => {
  const { data } = await api.post(`/stays/${id}/cancel`, {});
  return (data as ApiOk<{ booking: Stay; refund: any }>).results;
};

/**
 * A draft stay was never submitted, so there is nothing to refund or unstake —
 * the record is deleted outright instead of moving to `cancelled`.
 */
export const deleteDraftStay = async (id: string): Promise<void> => {
  await api.delete(`/booking/${id}`);
};

function unwrapStayMutationResult(data: { results?: unknown }): Stay {
  const r = data?.results as { booking?: Stay } | Stay;
  if (
    r &&
    typeof r === 'object' &&
    'booking' in r &&
    (r as { booking: Stay }).booking
  ) {
    return (r as { booking: Stay }).booking;
  }
  return r as Stay;
}

export function mapStayQuoteToUpdatedPrices(
  quote: StayQuoteResponse,
  duration: number,
  tokenGuestOpts?: { adults?: number; listingPrivate?: boolean | null },
): UpdatedPrices {
  const pl = quote.priceLock;
  const dailyTok = pl.dailyRentalToken;
  const tokenVal =
    tokenGuestOpts != null
      ? accommodationTokenTotalFromPriceLock(
          pl,
          duration,
          tokenGuestOpts.adults ?? 1,
          tokenGuestOpts.listingPrivate,
        )
      : Number(dailyTok?.val ?? 0) * (duration || 1);
  const payDelta: BookingPaymentDelta = {
    fiat: {
      val: quote.delta.fiat.val,
      cur: quote.delta.fiat.cur as CloserCurrencies.EUR,
    },
  };
  return {
    rentalFiat: {
      val: pl.lines.accommodation.val,
      cur: pl.lines.accommodation.cur as CloserCurrencies.EUR,
    },
    rentalToken: {
      val: tokenVal,
      cur: dailyTok.cur as CloserCurrencies.TDF,
    },
    utilityFiat: {
      val: pl.lines.utility.val,
      cur: pl.lines.utility.cur as CloserCurrencies.EUR,
    },
    foodFiat: {
      val: pl.lines.food.val,
      cur: pl.lines.food.cur as CloserCurrencies.EUR,
    },
    eventFiat: {
      val: pl.lines.event.val,
      cur: pl.lines.event.cur as CloserCurrencies.EUR,
    },
    total: {
      val: pl.total.val,
      cur: pl.total.cur as CloserCurrencies.EUR,
    },
    paymentDelta: payDelta,
  };
}

/** Phase one: price a change and hold it on `booking.pendingModification`.
 * The confirmed stay is untouched until the hold is confirmed. */
export const proposeStayModification = async (
  id: string,
  payload: StayModificationRequest,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/modification`, payload);
  return unwrapStayMutationResult(data);
};

/** Null once a checkout hold has expired, which is what frees its dates. */
export const getStayModification = async (
  id: string,
): Promise<PendingModification | null> => {
  const { data } = await api.get(`/stays/${id}/modification`);
  return (data?.results?.pendingModification ??
    null) as PendingModification | null;
};

/** Phase two: the only place a modification refunds. */
export const confirmStayModification = async (
  id: string,
): Promise<{ stay: Stay; refund: StayModificationRefund | null }> => {
  const { data } = await api.post(`/stays/${id}/modification/confirm`, {});
  return {
    stay: unwrapStayMutationResult(data),
    refund: (data?.results?.refund ?? null) as StayModificationRefund | null,
  };
};

export const discardStayModification = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/modification/discard`, {});
  return unwrapStayMutationResult(data);
};

/**
 * Co-guest membership lives on booking.guests, which PATCH /booking/:id
 * refuses to write — these are the only way to change it.
 */
export const addStayGuest = async (
  id: string,
  userId: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/guests`, { userId });
  return unwrapStayMutationResult(data);
};

export const removeStayGuest = async (
  id: string,
  userId: string,
): Promise<Stay> => {
  const { data } = await api.delete(`/stays/${id}/guests`, {
    data: { userId },
  });
  return unwrapStayMutationResult(data);
};

export const approveStayRequest = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/approve`, {});
  return unwrapStayMutationResult(data);
};

export const rejectStayRequest = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/reject`, {});
  return unwrapStayMutationResult(data);
};

/** `from` is the status the host was shown; the server refuses the change if the stay has moved since. */
export const setStayStatus = async (
  id: string,
  from: string,
  status: StayStatus,
  reason: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/set-status`, {
    from,
    status,
    reason,
  });
  return unwrapStayMutationResult(data);
};

export const exemptStayFromAutoCancel = async (
  id: string,
  reason: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/do-not-auto-cancel`, {
    reason,
  });
  return unwrapStayMutationResult(data);
};

export const getAutoCancelExemptStays = async (): Promise<
  AutoCancelExemptStay[]
> => {
  const { data } = await api.get('/stays/host/auto-cancel-exempt', {
    cache: false,
  } as Parameters<typeof api.get>[1]);
  return (data as ApiOk<AutoCancelExemptStay[]>).results;
};

/** Stays Stripe charged whose paid Charge is not recorded yet: the settlement invariant, 0 when healthy. */
export const getChargedAwaitingSettlementCount = async (): Promise<number> => {
  const { data } = await api.get('/stays/host/charged-awaiting-settlement', {
    cache: false,
  } as Parameters<typeof api.get>[1]);
  return (data as ApiOk<{ count: number }>).results.count;
};

/** `amount` is added to the stay's standing adjustment: negative waives, positive adds. */
export const adjustStayFiat = async (
  id: string,
  amount: number,
  reason: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/admin/adjust-fiat`, {
    amount,
    reason,
  });
  return unwrapStayMutationResult(data);
};

export type OffPlatformPayment = {
  method: OffPlatformChargeMethod;
  amount: number;
  reference?: string;
  reason: string;
};

export const recordStayPayment = async (
  id: string,
  payment: OffPlatformPayment,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/admin/record-payment`, payment);
  return unwrapStayMutationResult(data);
};

export const reverseStayPayment = async (
  id: string,
  chargeId: string,
  reason: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/admin/reverse-payment`, {
    chargeId,
    reason,
  });
  return unwrapStayMutationResult(data);
};

export const getStayChanges = async (
  id: string,
  page = 1,
): Promise<HostChangesPage> => {
  const { data } = await api.get(`/stays/${id}/changes`, {
    params: { page },
    cache: false,
  } as Parameters<typeof api.get>[1]);
  return (data as ApiOk<HostChangesPage>).results;
};

// closer-api answers at most this many stays per GET /stays/host/notes.
const HOST_NOTES_BATCH = 100;

/** Host notes by stay id, for the stays that have one. Hosts and admins only. */
export const getHostNotes = async (
  ids: string[],
): Promise<Record<string, HostNote>> => {
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += HOST_NOTES_BATCH) {
    batches.push(ids.slice(i, i + HOST_NOTES_BATCH));
  }
  const pages = await Promise.all(
    batches.map(async (batch) => {
      const { data } = await api.get('/stays/host/notes', {
        params: { ids: batch.join(',') },
        cache: false,
      } as Parameters<typeof api.get>[1]);
      return (data as ApiOk<Record<string, HostNote>>).results;
    }),
  );
  return Object.assign({}, ...pages);
};

/** `updatedAt` is the stamp of the note the host was shown; closer-api answers 409 if it moved. */
export const saveHostNote = async (
  id: string,
  text: string,
  updatedAt: string | null,
): Promise<HostNote | null> => {
  const { data } = await api.put(`/stays/${id}/host-note`, {
    text,
    updatedAt,
  });
  return (data as ApiOk<HostNote | null>).results;
};

export const getStayStripeIntents = async (
  id: string,
): Promise<StayStripeIntent[]> => {
  const { data } = await api.get(`/stays/${id}/admin/stripe-intents`, {
    cache: false,
  } as Parameters<typeof api.get>[1]);
  return (data as ApiOk<{ intents: StayStripeIntent[] }>).results.intents;
};

/** Settles every intent the dry run marked `settle`. */
export const settleStayStripe = async (
  id: string,
  reason: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/admin/settle-stripe`, {
    reason,
  });
  return unwrapStayMutationResult(data);
};

/** Clears a change stuck settling: finishes it if Stripe refunded, else hands it back. */
export const releaseStayModification = async (
  id: string,
  reason: string,
): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/modification/release`, {
    reason,
  });
  return unwrapStayMutationResult(data);
};

export type DiscountProbeResult = {
  status: 'success' | 'fail';
  reason: '' | 'invalid_code' | 'ticket_mismatch';
  applicableTicketName: string;
  discount: {
    code: string;
    name?: string;
    percent?: number;
    val?: number;
  } | null;
  currency?: CloserCurrencies;
  discountType: '' | 'percent' | 'val';
  discountVal: number;
  discountPercent: number;
};

/**
 * Probes a discount code. A rejected code is a 200 with status: 'fail' — only a
 * non-2xx means the request itself failed. Runs the same validator as the
 * eventDiscount write on PATCH /stays/:id/options.
 */
export const validateDiscountCode = async (payload: {
  discountCode: string;
  eventId?: string;
  stayId?: string;
  ticketOption?: unknown;
}): Promise<DiscountProbeResult> => {
  const { data } = await api.post('/stays/validate-discount-code', payload);
  return (data as ApiOk<DiscountProbeResult>).results;
};

export type SendStayToFriendsResult = {
  emailsSent: number;
  emails: string[];
  /** Malformed addresses skipped server-side; the rest were still sent. */
  invalidEmails?: string[];
  totalEmailsProcessed: number;
};

/**
 * Unlike the legacy endpoint, this no longer confirms the stay as a side
 * effect — submit the stay first or the server answers 400.
 *
 * Accepts the comma-separated string the stay stores as well as an array; omit
 * it entirely to let the server use the stay's own friendEmails.
 */
export const sendStayToFriends = async (
  id: string,
  friendEmails?: string[] | string | null,
): Promise<SendStayToFriendsResult> => {
  const emails =
    typeof friendEmails === 'string'
      ? friendEmails
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean)
      : (friendEmails ?? undefined);
  const { data } = await api.post(
    `/stays/${id}/send-to-friend`,
    emails?.length ? { friendEmails: emails } : {},
  );
  return (data as ApiOk<SendStayToFriendsResult>).results;
};

/**
 * Adds the caller to the stay's managedBy, which is what grants them
 * GET /stays/:id and the checkout pair. Idempotent; 403 when the caller's email
 * is not on the invite list.
 */
export const claimStayAsFriend = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/claim-as-friend`, {});
  return (data as ApiOk<Stay>).results;
};

export const checkInStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/check-in`, {});
  return unwrapStayMutationResult(data);
};

export const checkOutStay = async (id: string): Promise<Stay> => {
  const { data } = await api.post(`/stays/${id}/check-out`, {});
  return unwrapStayMutationResult(data);
};
