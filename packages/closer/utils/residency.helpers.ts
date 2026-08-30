import { Role } from '../types/api';
import { Listing } from '../types/booking';
import { Stay } from '../types/stay';
import {
  OverlappingStay,
  PresenceTier,
  ResidencyAccommodation,
  ResidencyAgreementSubmission,
  ResidencyParams,
  ResidencyQuote,
  ResidencySeason,
  ResidencySelection,
  ResidencyStanding,
  SeasonWindow,
} from '../types/residency';
import {
  isDurationDiscountFraction,
  resolveDurationDiscountsFromSettings,
} from './durationDiscount';
import { isStayTerminal } from './stays.api';

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const MS_PER_DAY = 86400000;

/**
 * The calendar day as UTC midnight. `toISOString()` on a local-midnight Date
 * rolls back a day everywhere east of Greenwich, which would book a stay
 * starting the day before the one the member picked.
 */
export const toUtcDateIso = (date: Date): string =>
  new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();

/**
 * A month of billing is 30 days, matching how the daily rate is derived from
 * the monthly base. Rounding up means a 31-day stay bills two months, which is
 * the intent: the season is committed to in whole months.
 */
export const BILLING_DAYS_PER_MONTH = 30;

/* ────────────────────────────── parameters ────────────────────────────── */

export const RESIDENCY_PARAM_DEFAULTS = {
  cashMultiplier: 0.7,
  maxCashOut: 700,
  sweatRate: 1.67,
  sweatMaxBonus: 300,
  foodMonthly: 336,
  utilitiesMonthly: 150,
  graceDays: 5,
  boundaryPenalty: 2,
  presenceScaleMax: 930,
  agreementVersion: '1.0',
};

const DEFAULT_TIERS: PresenceTier[] = [
  { label: 'Newcomer', minPresence: 0, cashPct: 0, unlocks: 'Resident roles' },
  { label: 'Rooted', minPresence: 30, cashPct: 0, unlocks: 'Team roles' },
  { label: 'Grown', minPresence: 100, cashPct: 30, unlocks: 'Cash out' },
  { label: 'Canopy', minPresence: 465, cashPct: 70, unlocks: 'Team Lead role' },
  {
    label: 'Keystone',
    minPresence: 930,
    cashPct: 100,
    unlocks: 'Director role',
  },
];

/**
 * Reads the `residency` config document into the shape the algorithm wants.
 * Every field falls back to its default independently, so a config saved
 * before this feature existed still produces a usable quote.
 */
export const parseResidencyConfig = (
  config: Record<string, any> | null | undefined,
  tokenValue: number,
  isTokenValueLive: boolean,
): ResidencyParams => {
  const value = config || {};

  const tiers: PresenceTier[] = Array.isArray(value.presenceTiers)
    ? value.presenceTiers
        .filter((tier: any) => tier && typeof tier === 'object')
        .map((tier: any) => ({
          label: String(tier.label ?? ''),
          minPresence: toNumber(tier.minPresence, 0),
          cashPct: clamp(toNumber(tier.cashPct, 0), 0, 100),
          unlocks: String(tier.unlocks ?? ''),
        }))
        .sort(
          (a: PresenceTier, b: PresenceTier) => a.minPresence - b.minPresence,
        )
    : DEFAULT_TIERS;

  const seasons: ResidencySeason[] = (
    Array.isArray(value.seasons) ? value.seasons : []
  )
    .filter((season: any) => season && typeof season === 'object')
    .map((season: any, index: number) => ({
      id: String(season.id || season.label || `season-${index}`),
      label: String(season.label ?? season.id ?? `Season ${index + 1}`),
      // Stored 1-12 so the admin form reads like a calendar; the algorithm
      // works in JS month indexes.
      startMonth: clamp(Math.round(toNumber(season.startMonth, 1)), 1, 12) - 1,
      durationMonths: Math.max(
        1,
        Math.round(toNumber(season.durationMonths, 1)),
      ),
      pace: season.pace === 'slow' ? 'slow' : 'high',
    }));

  const acknowledgements = (
    Array.isArray(value.acknowledgements) ? value.acknowledgements : []
  )
    .filter((item: any) => item && typeof item === 'object' && item.label)
    .map((item: any, index: number) => ({
      id: String(item.id || `acknowledgement-${index}`),
      label: String(item.label),
    }));

  return {
    cashMultiplier: toNumber(
      value.cashMultiplier,
      RESIDENCY_PARAM_DEFAULTS.cashMultiplier,
    ),
    maxCashOut: toNumber(value.maxCashOut, RESIDENCY_PARAM_DEFAULTS.maxCashOut),
    sweatRate: toNumber(value.sweatRate, RESIDENCY_PARAM_DEFAULTS.sweatRate),
    sweatMaxBonus: toNumber(
      value.sweatMaxBonus,
      RESIDENCY_PARAM_DEFAULTS.sweatMaxBonus,
    ),
    foodMonthly: toNumber(
      value.foodMonthly,
      RESIDENCY_PARAM_DEFAULTS.foodMonthly,
    ),
    utilitiesMonthly: toNumber(
      value.utilitiesMonthly,
      RESIDENCY_PARAM_DEFAULTS.utilitiesMonthly,
    ),
    graceDays: toNumber(value.graceDays, RESIDENCY_PARAM_DEFAULTS.graceDays),
    boundaryPenalty: toNumber(
      value.boundaryPenalty,
      RESIDENCY_PARAM_DEFAULTS.boundaryPenalty,
    ),
    presenceScaleMax: Math.max(
      1,
      toNumber(
        value.presenceScaleMax,
        RESIDENCY_PARAM_DEFAULTS.presenceScaleMax,
      ),
    ),
    presenceTiers: tiers.length ? tiers : DEFAULT_TIERS,
    seasons,
    acknowledgements,
    agreementTemplate: String(value.agreementTemplate ?? ''),
    agreementVersion: String(
      value.agreementVersion || RESIDENCY_PARAM_DEFAULTS.agreementVersion,
    ),
    tokenValue,
    isTokenValueLive,
  };
};

/* ───────────────────────────── accommodation ──────────────────────────── */

/** Roles this tool books for; a listing must be open to one of them. */
const RESIDENCY_BOOKING_CONTEXTS = ['team', 'resident'];

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The accommodation a season can be booked into, read off the platform's own
 * listings so pricing lives in one place rather than being restated in config.
 *
 * Listings are priced per night; a season bills in whole 30-day months, so both
 * prices are scaled by the same divisor the daily rate uses. A residency always
 * runs past the 28-night threshold, so the platform's monthly duration discount
 * applies exactly as it would to any long stay — without it a resident would
 * pay roughly three times what a guest pays for the same room for a month. It
 * scales fiat and tokens alike, as `calculateTotalAccommodationCost` does.
 *
 * A listing with no token price is kept — it is simply fiat only.
 */
export const listingsToAccommodations = (
  listings: Listing[] | null | undefined,
  bookingSettings?: Parameters<typeof resolveDurationDiscountsFromSettings>[0],
): ResidencyAccommodation[] => {
  const { monthly } = resolveDurationDiscountsFromSettings(bookingSettings);
  const rate =
    BILLING_DAYS_PER_MONTH *
    (isDurationDiscountFraction(monthly) ? 1 - monthly : 1);

  return (listings || [])
    .filter((listing) => {
      if (!listing || typeof listing !== 'object') return false;
      // Hourly spaces (desks, studios) are not somewhere you live.
      if (listing.priceDuration === 'hour') return false;
      if (!listing.fiatPrice && !listing.tokenPrice) return false;
      // An unset `availableFor` means unrestricted, as elsewhere in the app.
      const availableFor = listing.availableFor;
      if (!availableFor || !availableFor.length) return true;
      return (
        availableFor.includes('all') ||
        RESIDENCY_BOOKING_CONTEXTS.some((context) =>
          availableFor.includes(context),
        )
      );
    })
    .map((listing) => ({
      id: listing._id,
      label: listing.name,
      note: stripHtml(String(listing.description ?? '')).slice(0, 120),
      fiatMonthly: toNumber(listing.fiatPrice?.val, 0) * rate,
      tokensMonthly: toNumber(listing.tokenPrice?.val, 0) * rate,
      photo: listing.photos?.[0],
    }));
};

/* ──────────────────────────────── seasons ─────────────────────────────── */

/**
 * The concrete calendar window a season occupies next. A season whose start
 * month has already passed this year rolls to next year, so the tool always
 * offers a window you can still arrive in.
 */
export const getSeasonWindow = (
  season: ResidencySeason,
  now: Date = new Date(),
): SeasonWindow => {
  const year =
    season.startMonth < now.getMonth()
      ? now.getFullYear() + 1
      : now.getFullYear();
  const start = new Date(year, season.startMonth, 1);
  const end = new Date(year, season.startMonth + season.durationMonths, 0);
  const totalDays =
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

  const monthMarks: number[] = [];
  for (let index = 1; index < season.durationMonths; index++) {
    const monthStart = new Date(year, season.startMonth + index, 1);
    monthMarks.push(
      Math.round((monthStart.getTime() - start.getTime()) / MS_PER_DAY),
    );
  }

  return { start, end, totalDays, monthMarks };
};

/** The season whose window opens soonest from today. */
export const getUpcomingSeason = (
  seasons: ResidencySeason[],
  now: Date = new Date(),
): ResidencySeason | null => {
  if (!seasons.length) return null;
  const currentMonth = now.getMonth();

  return seasons.reduce((best, season) => {
    const delta = (season.startMonth - currentMonth + 12) % 12;
    const bestDelta = (best.startMonth - currentMonth + 12) % 12;
    return delta < bestDelta ? season : best;
  }, seasons[0]);
};

/* ─────────────────────────── existing bookings ────────────────────────── */

/**
 * The calendar day a bound falls on, as a day number.
 *
 * The two kinds of bound live in different frames and must each be read in
 * their own, or the overlap slips a day either side of Greenwich: stay dates
 * arrive from the API as UTC calendar days, while the season's arrival and
 * departure are Date objects built from local calendar components.
 */
const dayNumber = (value: string | Date): number => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const [year, month, day] =
    typeof value === 'string'
      ? [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()]
      : [date.getFullYear(), date.getMonth(), date.getDate()];
  return Math.round(Date.UTC(year, month, day) / MS_PER_DAY);
};

/**
 * Nights two date ranges share. Both are half-open — a stay ending on the day
 * another begins overlaps by zero nights, which is what check-out/check-in on
 * the same morning actually means.
 */
export const overlapNights = (
  aStart: string | Date,
  aEnd: string | Date,
  bStart: string | Date,
  bEnd: string | Date,
): number => {
  const from = Math.max(dayNumber(aStart), dayNumber(bStart));
  const to = Math.min(dayNumber(aEnd), dayNumber(bEnd));
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return to - from;
};

/**
 * The member's own stays that fall inside the season they are planning, with
 * the nights each one already covers. Cancelled and rejected stays hold no
 * space, so they are ignored.
 */
export const getOverlappingStays = (
  stays: Stay[] | null | undefined,
  arrival: Date,
  departure: Date,
  listingNameById: Record<string, string> = {},
): OverlappingStay[] =>
  (stays || [])
    .filter((stay) => stay && !isStayTerminal(stay) && stay.start && stay.end)
    .map((stay) => ({
      id: stay._id,
      listingName: stay.listing
        ? listingNameById[String(stay.listing)]
        : undefined,
      start: stay.start,
      end: stay.end,
      overlapNights: overlapNights(stay.start, stay.end, arrival, departure),
    }))
    .filter((stay) => stay.overlapNights > 0);

/* ───────────────────────────────── tiers ──────────────────────────────── */

export const getTierForPresence = (
  tiers: PresenceTier[],
  presence: number,
): PresenceTier =>
  [...tiers].reverse().find((tier) => presence >= tier.minPresence) ??
  tiers[0] ?? {
    label: '',
    minPresence: 0,
    cashPct: 0,
    unlocks: '',
  };

/** The lowest tier that clears the role's `minPresence` gate. */
export const getRequiredTier = (
  tiers: PresenceTier[],
  minPresence: number,
): PresenceTier =>
  tiers.find((tier) => tier.minPresence >= minPresence) ??
  tiers[tiers.length - 1] ??
  getTierForPresence(tiers, minPresence);

/* ───────────────────────────────── quote ──────────────────────────────── */

/**
 * The whole compensation algorithm, in one pure function:
 *
 *   gross  = (roleBase + sweatSeniority) × FTE
 *   living = (food + utilities) × stay%
 *   accom  = fiat × (1 − tokensLocked / tokensNeeded)
 *   net    = gross − living − accom
 *   cash   ≤ min(net × tier.cashPct, maxCashOut), paid × cashMultiplier
 *   rest   → tokens at the live token price
 *
 * Arriving late or leaving early beyond the grace window settles once against
 * the season payout, cash first.
 */
export const buildResidencyQuote = ({
  role,
  params,
  accommodations,
  standing,
  selection,
  existingStays,
  now = new Date(),
}: {
  role: Role;
  params: ResidencyParams;
  accommodations: ResidencyAccommodation[];
  standing: ResidencyStanding;
  selection: ResidencySelection;
  /** The member's own stays, to credit nights already booked and paid for. */
  existingStays?: Stay[] | null;
  now?: Date;
}): ResidencyQuote | null => {
  const season =
    params.seasons.find((item) => item.id === selection.seasonId) ??
    params.seasons[0];
  const accommodation =
    accommodations.find((item) => item.id === selection.accommodationId) ??
    accommodations[0];

  if (!season || !accommodation) return null;

  const window = getSeasonWindow(season, now);

  /* standing */
  const tier = getTierForPresence(params.presenceTiers, standing.presence);
  const tierIndex = params.presenceTiers.indexOf(tier);
  const nextTier = params.presenceTiers[tierIndex + 1] ?? null;
  const firstCashTier =
    params.presenceTiers.find((item) => item.cashPct > 0) ?? null;
  const minPresence = Math.max(0, toNumber(role.minPresence, 0));
  const requiredTier = getRequiredTier(params.presenceTiers, minPresence);
  const isRoleUnlocked = standing.presence >= minPresence;
  const presenceShortfall = Math.max(0, minPresence - standing.presence);

  /* dates */
  const arrivalOffset = clamp(
    Math.round(selection.arrivalDayOffset),
    0,
    window.totalDays - 1,
  );
  const departureOffset = clamp(
    Math.round(selection.departureDayOffset),
    arrivalOffset,
    window.totalDays - 1,
  );
  const arrival = new Date(
    window.start.getFullYear(),
    window.start.getMonth(),
    window.start.getDate() + arrivalOffset,
  );
  const departure = new Date(
    window.start.getFullYear(),
    window.start.getMonth(),
    window.start.getDate() + departureOffset,
  );
  const spanDays = departureOffset - arrivalOffset + 1;
  const months = clamp(
    Math.ceil(spanDays / BILLING_DAYS_PER_MONTH),
    1,
    season.durationMonths,
  );
  const daysLateIn = arrivalOffset;
  const daysEarlyOut = window.totalDays - 1 - departureOffset;

  /* accommodation cover */
  /*
   * Nights the member has already booked inside this window are paid for
   * elsewhere, so the season plan must not charge for them twice. The credit
   * is proportional: it scales the accommodation line and, with it, the tokens
   * needed to cover the stay.
   */
  // Nights, not days: arriving on the 1st and leaving on the 30th is 29
  // nights of accommodation, and an overlapping stay is counted the same way.
  const seasonNights = Math.max(0, spanDays - 1);
  const nightsAlreadyBooked = Math.min(
    seasonNights,
    getOverlappingStays(existingStays, arrival, departure).reduce(
      (total, stay) => total + stay.overlapNights,
      0,
    ),
  );
  const billableRatio =
    seasonNights > 0
      ? clamp((seasonNights - nightsAlreadyBooked) / seasonNights, 0, 1)
      : 1;

  const tokensNeeded = accommodation.tokensMonthly * months * billableRatio;
  const lockableMax = Math.min(standing.lockableTokens, tokensNeeded);
  const tokensLocked = clamp(selection.tokensLocked, 0, lockableMax);
  // No token price on the listing means no cover is on offer, so the full fiat
  // rate stands — treating "nothing needed" as "fully covered" would hand out
  // the room for free.
  const coverage = tokensNeeded > 0 ? tokensLocked / tokensNeeded : 0;
  const accommodationFiatMonthly =
    accommodation.fiatMonthly * billableRatio * (1 - coverage);

  /* allocation */
  const fullDaysPerWeek = Math.max(1, toNumber(role.daysPerWeek, 5));
  const fte = clamp(selection.daysPerWeek / fullDaysPerWeek, 0, 1);
  const sweatBonus = Math.min(
    params.sweatMaxBonus,
    standing.sweat * params.sweatRate,
  );
  const base = toNumber(role.baseCompensation, 0);
  const gross = (base + sweatBonus) * fte;
  const living =
    (params.foodMonthly + params.utilitiesMonthly) *
    clamp(selection.stayPct / 100, 0, 1);
  const net = gross - living - accommodationFiatMonthly;

  /* boundary penalty — one time, per stay */
  const dailyRate = gross / BILLING_DAYS_PER_MONTH;
  const latePenalty =
    daysLateIn > params.graceDays
      ? params.boundaryPenalty * dailyRate * daysLateIn
      : 0;
  const earlyPenalty =
    daysEarlyOut > params.graceDays
      ? params.boundaryPenalty * dailyRate * daysEarlyOut
      : 0;
  const boundaryPenalty = latePenalty + earlyPenalty;

  /* split */
  const cashCap = Math.max(
    0,
    Math.min((net * tier.cashPct) / 100, params.maxCashOut, net),
  );
  const cashRequested = clamp(selection.cashRequested, 0, cashCap);
  const cashReceived = cashRequested * params.cashMultiplier;
  const tokensEarnedMonthly =
    params.tokenValue > 0
      ? Math.max(0, net - cashRequested) / params.tokenValue
      : 0;

  const seasonCashBeforePenalty = cashReceived * months;
  const seasonCash = Math.max(0, seasonCashBeforePenalty - boundaryPenalty);
  const penaltyLeftForTokens = Math.max(
    0,
    boundaryPenalty - seasonCashBeforePenalty,
  );
  const seasonTokens = Math.max(
    0,
    tokensEarnedMonthly * months -
      (params.tokenValue > 0 ? penaltyLeftForTokens / params.tokenValue : 0),
  );

  return {
    tier,
    nextTier,
    requiredTier,
    firstCashTier,
    isRoleUnlocked,
    presenceShortfall,

    season,
    window,
    arrival,
    departure,
    spanDays,
    months,
    daysLateIn,
    daysEarlyOut,
    nightsAlreadyBooked,
    billableRatio,

    accommodation,
    fte,
    baseMonthly: base,
    sweatBonus,
    gross,
    living,
    tokensNeeded,
    lockableMax,
    tokensLocked,
    coverage,
    accommodationFiatMonthly,
    net,

    cashCap,
    cashRequested,
    cashReceived,
    tokensEarnedMonthly,

    latePenalty,
    earlyPenalty,
    boundaryPenalty,
    seasonCash,
    seasonTokens,
  };
};

/* ─────────────────────────────── agreement ────────────────────────────── */

const DEFAULT_AGREEMENT_TEMPLATE = `# Team member agreement

**{{platformName}} × {{memberName}}**
{{roleTitle}} — {{teamLabel}}

## Purpose

This agreement sets out the intention and mutual understanding between {{platformName}} and {{memberName}} regarding their work and contribution to the community, in the role of {{roleTitle}}.

## Term

Season: **{{seasonLabel}}**
Start date: **{{startDate}}**
End date: **{{endDate}}**
Billed term: **{{months}} month(s)**{{minTermLine}}

Both parties agree to communicate clearly and in good faith should either wish to end the residency early, with a minimum of two (2) weeks' notice required from either side.

## Position and responsibilities

{{responsibilities}}

### Community duties

{{communityDuties}}

## Time commitment

{{timeCommitment}}

Evenings and weekends are generally free time, except where operational needs (e.g. harvest timing) require otherwise.

## Compensation

{{platformName}} provides accommodation ({{accommodationLabel}}), food and utilities for the duration of the residency. These are benefits in kind and are deducted from the gross allocation as shown below.

- Base benefit — **{{baseMonthly}}** / month
- Seniority ({{sweatHeld}} $Sweat) — **+ {{sweatBonus}}** / month
- Commitment — **{{daysPerWeek}} days / week**
- Gross allocation — **{{gross}}** / month
- Food + utilities — **− {{living}}** / month
- Accommodation ({{coveragePct}}% token-covered) — **− {{accommodationFiat}}** / month
- **Net allocation — {{net}} / month**

Of the net allocation, up to **{{cashPct}}%** may be taken as cash at the {{tierLabel}} tier, capped at {{maxCashOut}} per month. Cash out is settled at a {{cashMultiplier}}× multiplier; the remainder is paid in {{tokenSymbol}} at the prevailing rate ({{tokenValue}} per token at the time of signing).

Over the {{months}}-month term:

- Cash — **{{seasonCash}}**
- {{tokenSymbol}} — **{{seasonTokens}} tokens**
- {{tokenSymbol}} locked against accommodation — **{{tokensLocked}} tokens**
{{penaltyRow}}

Fiat payments must be invoiced monthly or quarterly.

## Boundary commitment

The season window runs {{windowStart}} to {{windowEnd}}. Arriving more than {{graceDays}} days after it opens, or leaving more than {{graceDays}} days before it closes, is charged once at {{boundaryPenalty}}× the daily rate against the season payout.

## Non-disclosure

All data, materials, knowledge and information generated through or in connection with {{platformName}} or persons associated with its activities is confidential and must not be disclosed to any outside party. This includes internal documents, policies, procedures, financial information, conversations, messages, contacts, community member details and any other proprietary information encountered during the residency.

The Resident specifically agrees not to disclose any financial information relating to {{platformName}}, including treasury holdings, token distributions or individual compensation arrangements; the personal, financial or residency details of any other community member, resident, volunteer, guest or contributor; or any internal operational or strategic information.

This obligation applies for the full duration of the residency and continues for five (5) years following its end.

## Liability

The Resident acknowledges that participation in a working land community involves physical activity and exposure to the natural environment, and agrees to take personal responsibility for their own health, safety and wellbeing; to follow all safety guidelines and instructions provided by the land manager and team leads; to inform the team immediately of any injury, illness or unsafe condition; and to respect the property and infrastructure of {{platformName}}.

{{platformName}} will do its best to provide a safe and supportive environment, but cannot accept liability for personal injury, illness, loss or damage to personal property arising from participation in community life and work activities, except where caused by its own negligence.

## Illness

If unwell, the Resident agrees to inform their team lead immediately, avoid communal indoor spaces and shared meals while symptomatic, and maintain good hygiene. If the Resident is unable to work for more than one week due to illness, {{platformName}} may review the arrangement and, where appropriate, ask the Resident to cover accommodation and food at a guest rate, or pause the residency.

## Cancellation and termination

Either party may end this residency by giving two (2) weeks' notice. {{platformName}} may terminate immediately in cases of breach of the non-disclosure obligations, wilful damage to property or harm to community members, repeated failure to uphold the responsibilities outlined here, or behaviour that seriously conflicts with community values or the safety of others.

In the event of early termination for any of the above, no further token compensation is owed beyond the period worked.

## General

This agreement represents the full understanding between {{platformName}} and the Resident for this residency period. It may only be amended in writing with the agreement of both parties, and both parties agree to seek to resolve any disputes amicably before pursuing other remedies.

---

Agreement version {{agreementVersion}} · generated {{generatedOn}}`;

const bulletList = (items: string[] | undefined, fallback: string) =>
  items && items.length
    ? items.map((item) => `- ${item}`).join('\n')
    : fallback;

/**
 * Fills the template with the live quote. Unknown placeholders are left in
 * place rather than blanked, so a typo in a DAO-edited template is visible
 * instead of silently producing an empty clause.
 */
export const renderAgreement = ({
  template,
  role,
  quote,
  params,
  standing,
  memberName,
  platformName,
  tokenSymbol,
  formatCurrency,
  formatDate,
  now = new Date(),
}: {
  template: string;
  role: Role;
  quote: ResidencyQuote;
  params: ResidencyParams;
  standing: ResidencyStanding;
  memberName: string;
  platformName: string;
  tokenSymbol: string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date) => string;
  now?: Date;
}): string => {
  const teamLabels: Record<string, string> = {
    resident: 'Resident',
    team: 'Team',
    lead: 'Team Lead',
    executive: 'Executive Team',
  };

  const hoursPerDay = toNumber(role.hoursPerDay, 0);
  const timeCommitment = [
    hoursPerDay > 0
      ? `${hoursPerDay}h a day, ${
          quote.fte * toNumber(role.daysPerWeek, 5)
        } days a week.`
      : `${quote.fte * toNumber(role.daysPerWeek, 5)} days a week.`,
    'Schedule to be structured around operational needs, with regular check-ins to align on priorities.',
  ].join(' ');

  const values: Record<string, string> = {
    platformName,
    memberName,
    roleTitle: role.title,
    teamLabel: teamLabels[role.team ?? 'team'] ?? 'Team',
    seasonLabel: quote.season.label,
    startDate: formatDate(quote.arrival),
    endDate: formatDate(quote.departure),
    months: String(quote.months),
    minTermLine: role.minTermMonths
      ? `\nMinimum term: **${role.minTermMonths} months**`
      : '',
    responsibilities: bulletList(
      role.responsibilities,
      'As agreed with the team lead.',
    ),
    communityDuties: bulletList(
      role.communityDuties,
      'As with other residents, community duties apply in addition to the core role responsibilities.',
    ),
    timeCommitment,
    accommodationLabel: quote.accommodation.label,
    baseMonthly: formatCurrency(toNumber(role.baseCompensation, 0)),
    sweatHeld: String(Math.round(standing.sweat)),
    sweatBonus: formatCurrency(quote.sweatBonus),
    daysPerWeek: String(
      Math.round(quote.fte * toNumber(role.daysPerWeek, 5) * 10) / 10,
    ),
    gross: formatCurrency(quote.gross),
    living: formatCurrency(quote.living),
    coveragePct: String(Math.round(quote.coverage * 100)),
    accommodationFiat: formatCurrency(quote.accommodationFiatMonthly),
    net: formatCurrency(quote.net),
    cashPct: String(quote.tier.cashPct),
    tierLabel: quote.tier.label,
    maxCashOut: formatCurrency(params.maxCashOut),
    cashMultiplier: String(params.cashMultiplier),
    tokenSymbol,
    tokenValue: formatCurrency(params.tokenValue),
    seasonCash: formatCurrency(quote.seasonCash),
    seasonTokens: quote.seasonTokens.toFixed(1),
    tokensLocked: String(quote.tokensLocked),
    penaltyRow:
      quote.boundaryPenalty > 0
        ? `- Boundary settlement (one-time) — **− ${formatCurrency(
            quote.boundaryPenalty,
          )}**`
        : '',
    windowStart: formatDate(quote.window.start),
    windowEnd: formatDate(quote.window.end),
    graceDays: String(params.graceDays),
    boundaryPenalty: String(params.boundaryPenalty),
    agreementVersion: params.agreementVersion,
    generatedOn: formatDate(now),
  };

  const body = template.trim() || DEFAULT_AGREEMENT_TEMPLATE;

  return body.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
};

export const getAgreementTemplate = (
  role: Role,
  params: ResidencyParams,
): string =>
  role.agreementTemplate?.trim() ||
  params.agreementTemplate.trim() ||
  DEFAULT_AGREEMENT_TEMPLATE;

export const buildAgreementSubmission = ({
  role,
  quote,
  params,
  standing,
  selection,
  agreementBody,
  acknowledgedIds,
  now = new Date(),
}: {
  role: Role;
  quote: ResidencyQuote;
  params: ResidencyParams;
  standing: ResidencyStanding;
  selection: ResidencySelection;
  agreementBody: string;
  acknowledgedIds: string[];
  now?: Date;
}): ResidencyAgreementSubmission => ({
  roleId: role._id,
  roleTitle: role.title,
  agreementVersion: params.agreementVersion,
  stay: {
    listingId: quote.accommodation.id,
    start: toUtcDateIso(quote.arrival),
    end: toUtcDateIso(quote.departure),
    adults: 1,
    isTeamBooking: true,
    nightsAlreadyBooked: quote.nightsAlreadyBooked,
  },
  agreementBody,
  acceptedAt: now.toISOString(),
  acknowledgedIds,
  selection,
  standing,
  quote: {
    seasonId: quote.season.id,
    seasonLabel: quote.season.label,
    startDate: toUtcDateIso(quote.arrival),
    endDate: toUtcDateIso(quote.departure),
    months: quote.months,
    accommodationId: quote.accommodation.id,
    gross: quote.gross,
    living: quote.living,
    accommodationFiatMonthly: quote.accommodationFiatMonthly,
    net: quote.net,
    cashReceivedMonthly: quote.cashReceived,
    tokensEarnedMonthly: quote.tokensEarnedMonthly,
    tokensLocked: quote.tokensLocked,
    seasonCash: quote.seasonCash,
    seasonTokens: quote.seasonTokens,
    boundaryPenalty: quote.boundaryPenalty,
    tokenValue: params.tokenValue,
    nightsAlreadyBooked: quote.nightsAlreadyBooked,
    billableRatio: quote.billableRatio,
  },
});

export { DEFAULT_AGREEMENT_TEMPLATE };
