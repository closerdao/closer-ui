export type SeasonPace = 'high' | 'slow';

export interface PresenceTier {
  label: string;
  /** Floor of the tier, in $Presence. */
  minPresence: number;
  /** Share of the net allocation this tier may take as cash, 0-100. */
  cashPct: number;
  unlocks: string;
}

export interface ResidencySeason {
  id: string;
  label: string;
  /** 1-12, the calendar month the window opens in. */
  startMonth: number;
  durationMonths: number;
  pace: SeasonPace;
}

/** A bookable listing, restated in the monthly terms a season is billed in. */
export interface ResidencyAccommodation {
  id: string;
  label: string;
  note: string;
  fiatMonthly: number;
  /** 0 when the listing carries no token price — then it is fiat only. */
  tokensMonthly: number;
  photo?: string;
}

export interface ResidencyAcknowledgement {
  id: string;
  label: string;
}

/**
 * The whole parameter set the quote is computed from — the `residency` config
 * merged with the live token price. Nothing here is user input.
 */
export interface ResidencyParams {
  cashMultiplier: number;
  maxCashOut: number;
  sweatRate: number;
  sweatMaxBonus: number;
  foodMonthly: number;
  utilitiesMonthly: number;
  graceDays: number;
  boundaryPenalty: number;
  presenceScaleMax: number;
  presenceTiers: PresenceTier[];
  seasons: ResidencySeason[];
  acknowledgements: ResidencyAcknowledgement[];
  agreementTemplate: string;
  agreementVersion: string;
  /** Off the bonding curve at the live supply, not a stored config value. */
  tokenValue: number;
  /** True while the price is still being read from chain. */
  isTokenValueLive: boolean;
}

/** What the member holds, however it was read. */
export interface ResidencyStanding {
  presence: number;
  tokensHeld: number;
  sweat: number;
  /**
   * Tokens actually available to lock against a stay. Only a live, connected
   * wallet can spend, so this is 0 whenever the balances came off the cached
   * user record — unlike `tokensHeld`, which is only ever displayed.
   */
  lockableTokens: number;
}

export interface ResidencySelection {
  seasonId: string;
  /** Day offsets into the season window, inclusive. */
  arrivalDayOffset: number;
  departureDayOffset: number;
  accommodationId: string;
  tokensLocked: number;
  cashRequested: number;
  /** Days per week committed; the role's own `daysPerWeek` is full time. */
  daysPerWeek: number;
  stayPct: number;
}

/** An existing stay that overlaps the season being planned. */
export interface OverlappingStay {
  id: string;
  listingName?: string;
  start: string;
  end: string;
  /** Nights shared with the season window as currently selected. */
  overlapNights: number;
}

export interface SeasonWindow {
  start: Date;
  end: Date;
  totalDays: number;
  /** Day offsets where a new calendar month begins, for the slider ticks. */
  monthMarks: number[];
}

export interface ResidencyQuote {
  tier: PresenceTier;
  nextTier: PresenceTier | null;
  requiredTier: PresenceTier;
  firstCashTier: PresenceTier | null;
  isRoleUnlocked: boolean;
  presenceShortfall: number;

  season: ResidencySeason;
  window: SeasonWindow;
  arrival: Date;
  departure: Date;
  spanDays: number;
  months: number;
  daysLateIn: number;
  daysEarlyOut: number;
  /** Nights inside the season the member has already booked and paid for. */
  nightsAlreadyBooked: number;
  /** Share of the season still to pay accommodation on, 0-1. */
  billableRatio: number;

  accommodation: ResidencyAccommodation;
  fte: number;
  /** The role's own base, before seniority and before the FTE scaling. */
  baseMonthly: number;
  sweatBonus: number;
  gross: number;
  living: number;
  tokensNeeded: number;
  lockableMax: number;
  tokensLocked: number;
  coverage: number;
  accommodationFiatMonthly: number;
  net: number;

  cashCap: number;
  cashRequested: number;
  cashReceived: number;
  tokensEarnedMonthly: number;

  latePenalty: number;
  earlyPenalty: number;
  boundaryPenalty: number;
  seasonCash: number;
  seasonTokens: number;
}

/** The stay the season plan reserves, as POST /stays would describe it. */
export interface ResidencyStayRequest {
  listingId: string;
  /** ISO, inclusive of the arrival day. */
  start: string;
  /** ISO, the departure day. */
  end: string;
  adults: number;
  /** A residency is staffed accommodation, not a guest booking. */
  isTeamBooking: true;
  /** Nights inside the window already covered by the member's other stays. */
  nightsAlreadyBooked: number;
}

export interface ResidencyAgreementSubmission {
  roleId: string;
  roleTitle: string;
  agreementVersion: string;
  /** The booking the server must create and attach this agreement to. */
  stay: ResidencyStayRequest;
  /** The rendered markdown the member actually read. */
  agreementBody: string;
  acceptedAt: string;
  acknowledgedIds: string[];
  selection: ResidencySelection;
  standing: ResidencyStanding;
  /** Snapshot of the numbers, so a later config edit cannot rewrite them. */
  quote: {
    seasonId: string;
    seasonLabel: string;
    startDate: string;
    endDate: string;
    months: number;
    accommodationId: string;
    gross: number;
    living: number;
    accommodationFiatMonthly: number;
    net: number;
    cashReceivedMonthly: number;
    tokensEarnedMonthly: number;
    tokensLocked: number;
    seasonCash: number;
    seasonTokens: number;
    boundaryPenalty: number;
    tokenValue: number;
    nightsAlreadyBooked: number;
    billableRatio: number;
  };
}
