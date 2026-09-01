import { Role } from '../types/api';
import { Listing } from '../types/booking';
import { FoodOption } from '../types/food';
import {
  PresenceTier,
  ResidencyAccommodation,
  ResidencyAgreement,
  ResidencyAgreementSubmission,
  ResidencyMissingSetting,
  ResidencyParams,
  ResidencyPlan,
  ResidencySeason,
  ResidencySelection,
  ResidencyStanding,
  ResidencyStayRequest,
  SeasonWindow,
} from '../types/residency';
import {
  isDurationDiscountFraction,
  resolveDurationDiscountsFromSettings,
} from './durationDiscount';

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

/**
 * Every setting the season is laid out from, and how strictly it is checked.
 *
 * Nothing here has a code-side default, deliberately: a value invented in this
 * package would put one association's legal frame on another association's
 * page. A missing value is reported, not substituted.
 */
const RESIDENCY_TEXT_FIELDS: Extract<
  ResidencyMissingSetting,
  'associationName' | 'legalFramework' | 'agreementVersion'
>[] = ['associationName', 'legalFramework', 'agreementVersion'];

const RESIDENCY_NUMBER_FIELDS: {
  key: Extract<
    ResidencyMissingSetting,
    | 'noticeWeeks'
    | 'expenseReimbursementDays'
    | 'presenceScaleMax'
    | 'sweatRate'
    | 'sweatMaxBonus'
  >;
  /** True where a zero makes the value meaningless rather than simply small. */
  positive?: boolean;
}[] = [
  { key: 'noticeWeeks' },
  { key: 'expenseReimbursementDays' },
  { key: 'presenceScaleMax', positive: true },
  // Zero is a real answer for both: a village that adds nothing for seniority
  // says so, and the allocation is sized from the role's budget alone.
  { key: 'sweatRate' },
  { key: 'sweatMaxBonus' },
];

/** A number the platform actually stated, or null. Zero is a stated number. */
const readNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
};

/**
 * What the program spends supporting one volunteer for a month, taken from the
 * same booking setup every other stay is priced from rather than restated in
 * the residency config.
 *
 * These euros are internal: they are what the association subtracts from a
 * role's budget before converting the remainder into tokens. Nothing here is
 * charged to the volunteer, quoted to them, or written into an agreement —
 * putting a price on support in kind is exactly what turns it into pay.
 *
 * An option the platform switched off costs nothing and is not claimed as
 * provided. Null means the option is on but unpriced, which is a gap to report
 * rather than a free lunch.
 */
export const getResidencyLivingCosts = (
  bookingConfig: Record<string, any> | null | undefined,
  foodOptions: FoodOption[] | null | undefined,
): {
  foodMonthly: number | null;
  utilitiesMonthly: number | null;
  providesMeals: boolean;
  providesUtilities: boolean;
} => {
  const booking = bookingConfig || {};

  const isUtilityOn = booking.utilityOptionEnabled !== false;
  const utilityNightly = isUtilityOn ? readNumber(booking.utilityFiatVal) : 0;

  // The same option a booking defaults to, so a volunteer is fed at the rate
  // the village actually pays for board.
  const defaultFood =
    (foodOptions || []).find((option) => option?.isDefault) ??
    (foodOptions || [])[0];
  const isFoodOn = booking.foodOptionEnabled !== false;
  const foodNightly = isFoodOn ? readNumber(defaultFood?.price) : 0;

  return {
    foodMonthly:
      foodNightly === null ? null : foodNightly * BILLING_DAYS_PER_MONTH,
    utilitiesMonthly:
      utilityNightly === null ? null : utilityNightly * BILLING_DAYS_PER_MONTH,
    providesMeals: isFoodOn && (foodOptions || []).length > 0,
    providesUtilities: isUtilityOn,
  };
};

export interface ResidencyConfigRead {
  /** Null until the platform has stated every setting the season needs. */
  params: ResidencyParams | null;
  /** What is still unset, in the order the admin form lists it. */
  missing: ResidencyMissingSetting[];
}

/**
 * Reads the saved `residency` config document into the shape the page wants —
 * or, when the platform has not defined it yet, reports exactly which settings
 * are missing so the page can say so instead of laying out a season against
 * values nobody chose.
 *
 * Pass the document as the platform saved it (`getSavedConfig`), not the
 * schema-merged view: an unset number reads as 0 once the defaults are merged
 * in, which is indistinguishable from a village that really did choose zero.
 */
export const parseResidencyConfig = (
  config: Record<string, any> | null | undefined,
  /** Off the bonding curve; null while it could not be read. */
  tokenValue: number | null,
  isTokenValueLive: boolean,
  /** From `getResidencyLivingCosts`, not from this config. */
  living: {
    foodMonthly: number | null;
    utilitiesMonthly: number | null;
    providesMeals: boolean;
    providesUtilities: boolean;
  } = {
    foodMonthly: null,
    utilitiesMonthly: null,
    providesMeals: false,
    providesUtilities: false,
  },
): ResidencyConfigRead => {
  const value = config || {};
  const missing: ResidencyMissingSetting[] = [];

  const texts = {} as Record<(typeof RESIDENCY_TEXT_FIELDS)[number], string>;
  RESIDENCY_TEXT_FIELDS.forEach((key) => {
    const text = String(value[key] ?? '').trim();
    if (!text) {
      missing.push(key);
      return;
    }
    texts[key] = text;
  });

  const numbers = {} as Record<
    (typeof RESIDENCY_NUMBER_FIELDS)[number]['key'],
    number
  >;
  RESIDENCY_NUMBER_FIELDS.forEach((field) => {
    const parsed = readNumber(value[field.key]);
    if (parsed === null || (field.positive && parsed <= 0)) {
      missing.push(field.key);
      return;
    }
    numbers[field.key] = parsed;
  });

  // Priced by the platform's booking setup, not by this config.
  if (living.foodMonthly === null) missing.push('foodMonthly');
  if (living.utilitiesMonthly === null) missing.push('utilitiesMonthly');

  const presenceTiers: PresenceTier[] = (
    Array.isArray(value.presenceTiers) ? value.presenceTiers : []
  )
    .filter((tier: any) => tier && typeof tier === 'object' && tier.label)
    .map((tier: any) => ({
      label: String(tier.label),
      minPresence: readNumber(tier.minPresence) ?? 0,
      unlocks: String(tier.unlocks ?? ''),
    }))
    .sort((a: PresenceTier, b: PresenceTier) => a.minPresence - b.minPresence);
  if (!presenceTiers.length) missing.push('presenceTiers');

  const seasons: ResidencySeason[] = (
    Array.isArray(value.seasons) ? value.seasons : []
  )
    .filter(
      (season: any) =>
        season &&
        typeof season === 'object' &&
        (season.id || season.label) &&
        readNumber(season.startMonth) !== null,
    )
    .map((season: any, index: number) => ({
      id: String(season.id || season.label || `season-${index}`),
      label: String(season.label ?? season.id),
      // Stored 1-12 so the admin form reads like a calendar; the page works in
      // JS month indexes.
      startMonth:
        clamp(Math.round(readNumber(season.startMonth) ?? 1), 1, 12) - 1,
      durationMonths: Math.max(
        1,
        Math.round(readNumber(season.durationMonths) ?? 1),
      ),
      pace: season.pace === 'slow' ? 'slow' : 'high',
    }));
  if (!seasons.length) missing.push('seasons');

  // Not required: a village is free to ask for no acknowledgements beyond the
  // agreement itself.
  const acknowledgements = (
    Array.isArray(value.acknowledgements) ? value.acknowledgements : []
  )
    .filter((item: any) => item && typeof item === 'object' && item.label)
    .map((item: any, index: number) => ({
      id: String(item.id || `acknowledgement-${index}`),
      label: String(item.label),
    }));

  if (tokenValue === null || tokenValue <= 0) missing.push('tokenPrice');

  if (missing.length) return { params: null, missing };

  return {
    params: {
      ...texts,
      ...numbers,
      foodMonthly: living.foodMonthly as number,
      utilitiesMonthly: living.utilitiesMonthly as number,
      // Optional: a village with no explainer page simply shows no link, and
      // an agreement with no named court keeps the template's own wording.
      legalFrameworkUrl: String(value.legalFrameworkUrl ?? '').trim(),
      jurisdiction: String(value.jurisdiction ?? '').trim(),
      providesMeals: living.providesMeals,
      providesUtilities: living.providesUtilities,
      // Never inferred: an unticked box means no policy, and the slip then
      // makes no promise about one.
      providesInsurance: value.providesInsurance === true,
      presenceTiers,
      seasons,
      acknowledgements,
      // Optional: the page ships an agreement, and this only overrides it.
      agreementTemplate: String(value.agreementTemplate ?? '').trim(),
      tokenValue: tokenValue as number,
      isTokenValueLive,
    },
    missing: [],
  };
};

/* ───────────────────────────── accommodation ──────────────────────────── */

/**
 * A season is a residency, so the listing has to be one the platform opened to
 * residents — the same `availableFor` a host sets on any other listing.
 */
const RESIDENCY_LISTING_CONTEXT = 'resident';

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The accommodation a season can be booked into, read off the platform's own
 * listings so pricing lives in one place rather than being restated in config.
 * Only listings marked available for residents are offered.
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
      // Explicit only. Elsewhere an unset `availableFor` reads as unrestricted,
      // but a residency holds a room for a whole season — a listing nobody
      // opened to residents is an unfinished listing, not an invitation.
      return Boolean(listing.availableFor?.includes(RESIDENCY_LISTING_CONTEXT));
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

/* ───────────────────────────────── tiers ──────────────────────────────── */

export const getTierForPresence = (
  tiers: PresenceTier[],
  presence: number,
): PresenceTier =>
  [...tiers].reverse().find((tier) => presence >= tier.minPresence) ??
  tiers[0] ?? {
    label: '',
    minPresence: 0,
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

/**
 * The calendar months the stay runs through, clipped to it. A month the
 * volunteer is present for at all is a month of the program, which is what an
 * optional room upgrade is billed by.
 */
export const getStayMonths = (
  arrival: Date,
  departure: Date,
): { year: number; month: number; days: number }[] => {
  const months: { year: number; month: number; days: number }[] = [];
  const cursor = new Date(arrival.getFullYear(), arrival.getMonth(), 1);
  const last = new Date(departure.getFullYear(), departure.getMonth(), 1);

  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const final = new Date(year, month + 1, 0);
    const from = arrival > first ? arrival : first;
    const to = departure < final ? departure : final;
    months.push({
      year,
      month,
      // Rounded, not truncated: a daylight-saving shift inside the month
      // leaves the span an hour short of a whole number of days.
      days: Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1,
    });
    cursor.setMonth(month + 1);
  }

  return months;
};

/* ────────────────────────────────── plan ──────────────────────────────── */

/**
 * A season as it stands for one volunteer.
 *
 * There is no allocation in here and no arithmetic that could look like pay:
 * the program covers the room, the board and the utilities outright, and the
 * only figures are what the volunteer chooses to spend on top of that.
 *
 *   included     = the cheapest room open to residents, at no cost
 *   upgrade      = (chosen − included), per month, in euros and in tokens
 *   spent        = what the volunteer decides to spend of their own holding
 *   allocation   = (role budget + seniority) × rhythm − program costs,
 *                  converted at the bonding curve price into tokens
 *   withheld     = the rest of the upgrade, taken out of the allocation at
 *                  that same price rather than out of the volunteer
 *   owed         = whatever the allocation could not absorb, in euros
 *
 * The last line is budgeting, and it stays inside the association: what the
 * volunteer is shown is a quantity of tokens and its fair market value, which
 * is zero — the token has no liquid market, so nothing of monetary value
 * changes hands. Ending early costs nothing, so nothing here settles a
 * boundary.
 */
export const buildResidencyPlan = ({
  role,
  params,
  accommodations,
  standing,
  selection,
  now = new Date(),
}: {
  role: Role;
  params: ResidencyParams;
  accommodations: ResidencyAccommodation[];
  standing: ResidencyStanding;
  selection: ResidencySelection;
  now?: Date;
}): ResidencyPlan | null => {
  const season =
    params.seasons.find((item) => item.id === selection.seasonId) ??
    params.seasons[0];
  /*
   * The covered room is the cheapest one the platform opened to residents:
   * whatever a village asks the least for is what it can afford to give. Every
   * other room is an upgrade priced at the difference.
   */
  const includedAccommodation = [...accommodations].sort(
    (a, b) => a.fiatMonthly - b.fiatMonthly,
  )[0];
  const accommodation =
    accommodations.find((item) => item.id === selection.accommodationId) ??
    includedAccommodation;

  if (!season || !accommodation || !includedAccommodation) return null;

  const window = getSeasonWindow(season, now);

  /* standing */
  const tier = getTierForPresence(params.presenceTiers, standing.presence);
  const tierIndex = params.presenceTiers.indexOf(tier);
  const nextTier = params.presenceTiers[tierIndex + 1] ?? null;
  const minPresence = Math.max(0, readNumber(role.minPresence) ?? 0);
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
  const months = getStayMonths(arrival, departure).length;

  /* what the volunteer adds on top of what the program covers */
  const needsAccommodation = selection.needsAccommodation !== false;
  const isUpgrade =
    needsAccommodation && accommodation.id !== includedAccommodation.id;

  const upgradeFiatMonthly = isUpgrade
    ? Math.max(0, accommodation.fiatMonthly - includedAccommodation.fiatMonthly)
    : 0;
  const upgradeTokensMonthly = isUpgrade
    ? Math.max(
        0,
        accommodation.tokensMonthly - includedAccommodation.tokensMonthly,
      )
    : 0;

  /*
   * The allocation, sized the way the association budgets a position: what it
   * has for the role — its base, plus what seniority adds, scaled by the
   * rhythm agreed — less what the program spends housing and feeding one
   * volunteer for a month. Whatever budget is left over is converted into
   * tokens at the bonding curve price.
   *
   * This is the association's own arithmetic and stays there. The volunteer is
   * shown a number of tokens and what it is worth on a market — nothing, there
   * being no market — and never a euro figure, a rate or an hourly anything.
   */
  const fte = clamp(
    selection.halfDaysPerWeek / Math.max(1, readNumber(role.daysPerWeek) ?? 5),
    0,
    1,
  );
  const sweatBonus = Math.min(
    params.sweatMaxBonus,
    standing.sweat * params.sweatRate,
  );
  const budgetMonthly =
    ((readNumber(role.baseCompensation) ?? 0) + sweatBonus) * fte;
  /*
   * What the program actually spends on this volunteer: board and power
   * whenever the platform provides them, and the covered room whenever they
   * take one. An upgrade is bought by the volunteer, so it never enters here —
   * the association's cost is the room it covers, not the room they chose.
   */
  const programCostsMonthly =
    (params.providesMeals ? params.foodMonthly : 0) +
    (params.providesUtilities ? params.utilitiesMonthly : 0) +
    (needsAccommodation ? includedAccommodation.fiatMonthly : 0);
  const netBudgetMonthly = Math.max(0, budgetMonthly - programCostsMonthly);
  const tokensDistributedMonthly =
    params.tokenValue > 0 ? netBudgetMonthly / params.tokenValue : 0;

  const seasonTokensDistributed = tokensDistributedMonthly * months;

  /*
   * An upgrade is settled in three passes, and euros are the last of them:
   *
   *   1. tokens the volunteer already holds, at the room's own token rate
   *   2. the season's allocation, at the bonding curve price — tokens the
   *      association simply does not issue, rather than tokens anyone moves
   *   3. euros, for whatever neither pass could absorb
   *
   * The second pass is the association's own arithmetic run backwards: the
   * budget for the position was converted into tokens at the curve price, so
   * the room chosen out of that budget converts back at the same price. A
   * volunteer who never touches their wallet is not handed a bill while the
   * association still has budget for the position.
   */
  const upgradeFiatSeason = upgradeFiatMonthly * months;

  const tokensNeeded = upgradeTokensMonthly * months;
  const spendableMax = Math.min(standing.lockableTokens, tokensNeeded);
  const tokensSpent = clamp(selection.tokensSpent, 0, spendableMax);
  // No token price on the listing means the upgrade is euro-only, so nothing
  // is covered — treating "nothing needed" as "fully covered" would hand the
  // room over for free.
  const coverage = tokensNeeded > 0 ? tokensSpent / tokensNeeded : 0;
  const fiatAfterTokensSpent = upgradeFiatSeason * (1 - coverage);

  /*
   * Netted in euros rather than in tokens so that an allocation which covers
   * the whole upgrade leaves exactly nothing owed — dividing and multiplying
   * back by the curve price would leave a fraction of a cent behind, and a
   * fraction of a cent still reads as a bill.
   */
  const fiatFromAllocation = Math.min(
    fiatAfterTokensSpent,
    seasonTokensDistributed * params.tokenValue,
  );
  const seasonTokensWithheld =
    params.tokenValue > 0 ? fiatFromAllocation / params.tokenValue : 0;
  const seasonTokensIssued = Math.max(
    0,
    seasonTokensDistributed - seasonTokensWithheld,
  );
  const tokensIssuedMonthly = months > 0 ? seasonTokensIssued / months : 0;
  const seasonFiatOwed = fiatAfterTokensSpent - fiatFromAllocation;

  return {
    tier,
    nextTier,
    requiredTier,
    isRoleUnlocked,
    presenceShortfall,

    season,
    window,
    arrival,
    departure,
    spanDays,
    months,
    // $Presence counts days on the land, and nothing else.
    presenceEarned: needsAccommodation ? spanDays : 0,
    halfDaysPerWeek: Math.max(0, Math.round(selection.halfDaysPerWeek)),

    budgetMonthly,
    sweatBonus,
    fte,
    programCostsMonthly,
    netBudgetMonthly,
    tokensDistributedMonthly,
    seasonTokensDistributed,
    seasonTokensWithheld,
    seasonTokensIssued,
    tokensIssuedMonthly,

    includedAccommodation,
    accommodation,
    needsAccommodation,
    isUpgrade,

    upgradeFiatMonthly,
    upgradeTokensMonthly,
    upgradeFiatSeason,
    tokensNeeded,
    spendableMax,
    tokensSpent,
    coverage,
    seasonFiatOwed,
    seasonTokensSpent: tokensSpent,
  };
};

/* ─────────────────────────────── agreement ────────────────────────────── */

const bulletList = (items: string[] | undefined, fallback: string) =>
  items && items.length
    ? items.map((item) => `- ${item}`).join('\n')
    : fallback;

/**
 * Clause 6.1, in both languages, and the Annex I line that backs it.
 *
 * An association that has not taken a policy out must not have an agreement
 * say it has — so the clause states the truth either way, and hands the
 * volunteer the responsibility rather than leaving it unsaid. The volunteer
 * identification card is a separate entitlement and is issued regardless.
 */
const insuranceClauses = (
  providesInsurance: boolean,
): { en: string; pt: string; annex: string } =>
  providesInsurance
    ? {
        en: '6.1. The Association provides personal accident insurance covering the Program activities of the Volunteer (policy identified in Annex I) and issues the volunteer identification card.',
        pt: '6.1. A Associação assegura um seguro de acidentes pessoais que cobre as atividades do(a) Voluntário(a) no âmbito do Programa (apólice identificada no Anexo I) e emite o cartão de identificação de voluntário.',
        annex: '[insurer, policy no.]',
      }
    : {
        en: '6.1. The Association does not currently hold a personal accident policy for the activities of the Program: the Volunteer is responsible for their own health and accident cover and confirms they hold it. The Association issues the volunteer identification card.',
        pt: '6.1. A Associação não dispõe atualmente de seguro de acidentes pessoais para as atividades do Programa: o(a) Voluntário(a) é responsável pela sua própria cobertura de saúde e de acidentes e confirma que a possui. A Associação emite o cartão de identificação de voluntário.',
        annex: 'none held by the Association / não assegurado pela Associação',
      };

/**
 * How an upgrade was actually settled, in the order the plan settles it. Each
 * source is named separately so the agreement records what the Volunteer paid
 * and what the Association absorbed, rather than one blended figure.
 */
const settledBy = (
  plan: ResidencyPlan,
  tokenSymbol: string,
  formatCurrency: (value: number) => string,
): string => {
  const parts: string[] = [];
  if (plan.seasonTokensSpent > 0) {
    parts.push(
      `${Number(
        plan.seasonTokensSpent.toFixed(2),
      )} ${tokenSymbol} staked by the Volunteer`,
    );
  }
  if (plan.seasonTokensWithheld > 0) {
    parts.push(
      `${Number(
        plan.seasonTokensWithheld.toFixed(2),
      )} ${tokenSymbol} withheld from the season allocation`,
    );
  }
  if (plan.seasonFiatOwed > 0) {
    parts.push(`${formatCurrency(plan.seasonFiatOwed)} paid by the Volunteer`);
  }
  return parts.length ? parts.join('; ') : 'at no cost to the Volunteer';
};

/**
 * Fills the template from the live season. Unknown placeholders are left in
 * place rather than blanked, so a typo in an association-edited template is
 * visible instead of silently producing an empty clause.
 *
 * Every value here describes participation and the support around it. There is
 * deliberately no figure for what the room, the board or the utilities would
 * have cost: naming a price for what the program gives is what turns support
 * under the gratuitidade principle into something that reads like pay.
 */
export const renderAgreement = ({
  template,
  role,
  plan,
  params,
  volunteerName,
  platformName,
  tokenSymbol,
  formatCurrency,
  formatDate,
  now = new Date(),
}: {
  template: string;
  role: Role;
  plan: ResidencyPlan;
  params: ResidencyParams;
  volunteerName: string;
  platformName: string;
  tokenSymbol: string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date) => string;
  now?: Date;
}): string => {
  const insurance = insuranceClauses(params.providesInsurance);

  const values: Record<string, string> = {
    insuranceClause: insurance.en,
    insuranceClausePt: insurance.pt,
    insuranceAnnexLine: insurance.annex,
    associationName: params.associationName,
    legalFramework: params.legalFramework,
    jurisdiction: params.jurisdiction,
    platformName,
    volunteerName,
    roleTitle: role.title,
    seasonLabel: plan.season.label,
    startDate: formatDate(plan.arrival),
    endDate: formatDate(plan.departure),
    months: String(plan.months),
    days: String(plan.spanDays),
    halfDaysPerWeek: String(plan.halfDaysPerWeek),
    noticeWeeks: String(params.noticeWeeks),
    expenseReimbursementDays: String(params.expenseReimbursementDays),
    focusAreas: bulletList(
      role.responsibilities,
      'As agreed with the Program coordinator.',
    ),
    communityDuties: bulletList(
      role.communityDuties,
      'As with every volunteer, community life is shared.',
    ),
    includedAccommodation: plan.needsAccommodation
      ? plan.includedAccommodation.label
      : 'None — the Volunteer houses themselves off site.',
    upgradeLine: plan.isUpgrade
      ? `${plan.accommodation.label}, chosen by the Volunteer — ${settledBy(
          plan,
          tokenSymbol,
          formatCurrency,
        )}`
      : 'None',
    tokenSymbol,
    // The allocation as it is actually made: net of whatever the Volunteer's
    // chosen room took out of the budget for the position.
    tokensDistributed: Number(plan.seasonTokensIssued.toFixed(2)).toString(),
    tokensDistributedMonthly: Number(
      plan.tokensIssuedMonthly.toFixed(2),
    ).toString(),
    tokenFairValue: formatCurrency(0),
    agreementVersion: params.agreementVersion,
    generatedOn: formatDate(now),
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
};

export const getAgreementTemplate = (
  role: Role,
  params: ResidencyParams,
  fallback: string,
): string =>
  role.agreementTemplate?.trim() || params.agreementTemplate || fallback;

/**
 * The booking a signed season asks the server to create.
 *
 * A volunteer who houses themselves off site has no room to hold, so no stay
 * is requested at all — they are on the land for the activities, and their
 * days are logged by check-in like anyone else's.
 */
export const buildStayRequest = (
  plan: ResidencyPlan,
): ResidencyStayRequest | null => {
  if (!plan.needsAccommodation) return null;

  return {
    listingId: plan.accommodation.id,
    start: toUtcDateIso(plan.arrival),
    end: toUtcDateIso(plan.departure),
    adults: 1,
    isTeamBooking: true,
  };
};

export const buildAgreementSubmission = ({
  role,
  plan,
  params,
  standing,
  selection,
  agreementBody,
  acknowledgedIds,
  now = new Date(),
}: {
  role: Role;
  plan: ResidencyPlan;
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
  stay: buildStayRequest(plan),
  agreementBody,
  acceptedAt: now.toISOString(),
  acknowledgedIds,
  selection,
  standing,
  /*
   * The dates alone. The server recomputes the whole season from the
   * association's own inputs and files its own result, so these are here only
   * to say which year's instance of the season is being joined — which the day
   * offsets cannot. Sending the figures the page drew would be sending
   * arithmetic nobody reads, and inviting someone to trust it later.
   */
  program: {
    startDate: toUtcDateIso(plan.arrival),
    endDate: toUtcDateIso(plan.departure),
  },
});

/** The UTC midnight of whatever calendar day a stored date falls on. */
const toUtcDayStart = (value: string | Date): number => {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

/**
 * Whether the season is under way. The volunteer's own calendar day decides
 * it — read locally, then compared as a UTC midnight the way `toUtcDateIso`
 * normalises every other date here — so "before it starts" means the same
 * thing in Lisbon and in Auckland.
 */
export const hasResidencyStarted = (
  startDate: string,
  now: Date = new Date(),
): boolean =>
  Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) >=
  toUtcDayStart(startDate);

/**
 * Whether the volunteer may end their own season. They may, right up until it
 * starts; after that the coordinator ends it with them, which is a
 * conversation rather than a button. Nothing is charged either way — the
 * window is about who presses the button, not about a penalty.
 *
 * The server enforces the same window: this only decides what is offered.
 */
export const canVolunteerCancelResidency = (
  agreement: Pick<ResidencyAgreement, 'status' | 'program'>,
  now: Date = new Date(),
): boolean =>
  agreement.status !== 'cancelled' &&
  !hasResidencyStarted(agreement.program.startDate, now);
