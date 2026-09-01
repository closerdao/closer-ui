export type SeasonPace = 'high' | 'slow';

/**
 * A step on the volunteer's journey. It carries recognition — priority on a
 * season window, a mentor role — and never money: nothing on this ladder is
 * earned, owed or convertible (agreement clause 7.2).
 */
export interface PresenceTier {
  label: string;
  /** Floor of the tier, in $Presence. */
  minPresence: number;
  /** What reaching it opens up, in the village's own words. */
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
 * A setting the tool cannot lay out a season without. `tokenPrice` comes off
 * the bonding curve, `accommodation` off the platform's listings, and
 * `foodMonthly` / `utilitiesMonthly` off its booking setup; the rest are keys
 * of the saved `residency` config document.
 */
export type ResidencyMissingSetting =
  | 'associationName'
  | 'legalFramework'
  | 'noticeWeeks'
  | 'expenseReimbursementDays'
  | 'presenceScaleMax'
  | 'sweatRate'
  | 'sweatMaxBonus'
  | 'foodMonthly'
  | 'utilitiesMonthly'
  | 'presenceTiers'
  | 'seasons'
  | 'agreementVersion'
  | 'tokenPrice'
  | 'accommodation';

/**
 * Everything the season is laid out from — the `residency` config merged with
 * the live token price. Nothing here is user input, and nothing here has a
 * default: every value is one the platform stated itself.
 */
export interface ResidencyParams {
  /** The promoting organisation, in whose name the agreement is concluded. */
  associationName: string;
  /** The law the program runs under, e.g. "Lei n.º 71/98". */
  legalFramework: string;
  /** Optional page explaining volunteering against paid work. */
  legalFrameworkUrl: string;
  /** Where a dispute would be heard, for the agreement's general clause. */
  jurisdiction: string;
  /** Courtesy notice both sides aim to give before ending a season. */
  noticeWeeks: number;
  /** Days within which documented expenses are reimbursed. */
  expenseReimbursementDays: number;
  /** What the program covers, read off the platform's own booking setup. */
  providesMeals: boolean;
  providesUtilities: boolean;
  /**
   * Whether the association holds a personal accident policy for program
   * activities. Stated in the `residency` config rather than assumed: this is
   * a promise about cover somebody actually bought.
   */
  providesInsurance: boolean;
  presenceScaleMax: number;
  /*
   * How the association sizes a season's token allocation, internally. Euros
   * of budget added per $Sweat held and its ceiling, and what the program
   * spends housing and feeding one volunteer for a month — all of it read from
   * the platform's own booking setup rather than restated here.
   *
   * None of these figures is ever shown to a volunteer or written into an
   * agreement: they size a quantity of tokens, and that quantity is what the
   * volunteer sees. See `ResidencyPlan` for why.
   */
  sweatRate: number;
  sweatMaxBonus: number;
  foodMonthly: number;
  utilitiesMonthly: number;
  presenceTiers: PresenceTier[];
  seasons: ResidencySeason[];
  acknowledgements: ResidencyAcknowledgement[];
  agreementTemplate: string;
  agreementVersion: string;
  /**
   * Off the bonding curve at the live supply. It converts a budget into a
   * number of tokens and is never displayed: the tokens allocated have no
   * liquid market to be sold into, so what they are worth to the volunteer is
   * zero, whatever it costs to buy one from the curve.
   */
  tokenValue: number;
  /** True while the price is still being read from chain. */
  isTokenValueLive: boolean;
}

/** What the volunteer holds, however it was read. */
export interface ResidencyStanding {
  presence: number;
  tokensHeld: number;
  sweat: number;
  /**
   * Tokens actually available to spend on an upgrade. Only a live, connected
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
  /** The room the volunteer takes: the covered one, or an upgrade. */
  accommodationId: string;
  /** Tokens the volunteer chooses to spend on an upgrade. */
  tokensSpent: number;
  /** The indicative rhythm agreed with the coordinator, in half-days. */
  halfDaysPerWeek: number;
  /** False when the volunteer houses themselves off site. */
  needsAccommodation: boolean;
}

export interface SeasonWindow {
  start: Date;
  end: Date;
  totalDays: number;
  /** Day offsets where a new calendar month begins, for the slider ticks. */
  monthMarks: number[];
}

/**
 * A season as it stands for one volunteer: what the program covers, what they
 * chose to add on top of it, and what that costs them. There is no allocation,
 * no cash and no penalty anywhere in it — volunteering is unpaid, freely
 * given and freely ended.
 */
export interface ResidencyPlan {
  tier: PresenceTier;
  nextTier: PresenceTier | null;
  requiredTier: PresenceTier;
  isRoleUnlocked: boolean;
  presenceShortfall: number;

  season: ResidencySeason;
  window: SeasonWindow;
  arrival: Date;
  departure: Date;
  spanDays: number;
  months: number;
  /** Days on the land this season, the only thing $Presence counts. */
  presenceEarned: number;
  halfDaysPerWeek: number;

  /*
   * The community allocation for this season, in tokens.
   *
   * Sized the way the association budgets a position — what it has for the
   * role, less what the program spends supporting the volunteer, converted at
   * the bonding curve price — but that is budgeting, not pay. The volunteer is
   * told a quantity of tokens and its fair market value, which is nothing;
   * `budgetMonthly`, `programCostsMonthly` and the rest never reach the page,
   * the agreement or the signed snapshot.
   */
  budgetMonthly: number;
  sweatBonus: number;
  fte: number;
  programCostsMonthly: number;
  netBudgetMonthly: number;
  tokensDistributedMonthly: number;
  /** The allocation as budgeted, before any upgrade is taken out of it. */
  seasonTokensDistributed: number;
  /**
   * Tokens the association does not issue because the volunteer's chosen room
   * came out of the budget for the position, converted at the same bonding
   * curve price the allocation was sized with. Nothing moves on chain here —
   * these are tokens that are simply never minted to the volunteer.
   */
  seasonTokensWithheld: number;
  /** What is actually issued: the allocation, less what the upgrade took. */
  seasonTokensIssued: number;
  tokensIssuedMonthly: number;

  /** The room the program covers: the cheapest one open to residents. */
  includedAccommodation: ResidencyAccommodation;
  /** What the volunteer actually takes. */
  accommodation: ResidencyAccommodation;
  needsAccommodation: boolean;
  isUpgrade: boolean;

  /** The difference over the covered room — never the whole rate. */
  upgradeFiatMonthly: number;
  upgradeTokensMonthly: number;
  /** The whole upgrade for the season, before anything is set against it. */
  upgradeFiatSeason: number;
  /** Tokens the whole season's upgrade would cost, and what is spent on it. */
  tokensNeeded: number;
  spendableMax: number;
  tokensSpent: number;
  coverage: number;
  /**
   * Euros still owed once the volunteer's own tokens and the season's
   * allocation have both been set against the upgrade — nothing, whenever the
   * budget for the position still had room in it.
   */
  seasonFiatOwed: number;
  seasonTokensSpent: number;
}

/** The stay the season plan reserves, as POST /stays would describe it. */
export interface ResidencyStayRequest {
  listingId: string;
  /** ISO, inclusive of the arrival day. */
  start: string;
  /** ISO, the departure day. */
  end: string;
  adults: number;
  /** A volunteer season is program accommodation, not a guest booking. */
  isTeamBooking: true;
  /**
   * Set when the volunteer houses themselves: the listing is only there to
   * hang the stay off, so it is probably spoken for by someone else.
   */
  note?: string;
}

export interface ResidencyAgreementSubmission {
  roleId: string;
  roleTitle: string;
  agreementVersion: string;
  /**
   * The booking the server must create and attach this agreement to, or null
   * when the volunteer houses themselves off site.
   */
  stay: ResidencyStayRequest | null;
  /** The rendered markdown the volunteer actually read, both languages. */
  agreementBody: string;
  acceptedAt: string;
  acknowledgedIds: string[];
  selection: ResidencySelection;
  standing: ResidencyStanding;
  /**
   * Which year's instance of the season is being joined — the day offsets in
   * `selection` alone do not say.
   *
   * Only these two dates are sent, and the server reads them only when there
   * is no stay to read them off. Everything else the page worked out about the
   * season is recomputed server-side from the association's own inputs and
   * comes back in the response; sending our arithmetic would only invite
   * somebody to trust it.
   */
  program: {
    startDate: string;
    endDate: string;
  };
}

/**
 * The season as the association computed and froze it at signing. Every figure
 * here is the server's, never the page's: if the bonding curve moved between
 * the read that drew the tool and the write that filed the agreement, this is
 * the one that was signed.
 */
export interface ResidencyProgram {
  seasonId: string;
  seasonLabel: string;
  startDate: string;
  endDate: string;
  /** Calendar months the stay touches, not 30-day blocks. */
  months: number;
  halfDaysPerWeek: number;
  /** The room the program covers. */
  includedAccommodationId: string;
  /** The one actually taken — null when the volunteer houses themselves. */
  accommodationId: string | null;
  needsAccommodation: boolean;
  isUpgrade: boolean;
  upgradeFiatMonthly: number;
  upgradeTokensMonthly: number;
  upgradeFiatSeason: number;
  /**
   * Euros left after the volunteer's own staked tokens and the season's
   * allocation have both been set against the upgrade. Normally 0, and the
   * only euro figure a volunteer may be shown besides the upgrade itself.
   */
  seasonFiatOwed: number;
  seasonTokensSpent: number;
  /** Days on the land; 0 for a volunteer who houses themselves. */
  presenceEarned: number;
  /** The allocation actually made, after the room came out of the budget. */
  seasonTokensDistributed: number;
  seasonTokensWithheld: number;
  /** Always 0 — the token has no liquid market to be sold into. */
  tokenFairValue: 0;
}

/**
 * Where a season stands. Not a state machine: either side may end
 * participation at any time, so `cancelled` records that it happened rather
 * than gating anything, and nothing is charged or clawed back on the way out.
 */
export type ResidencyAgreementStatus =
  | 'pending'
  | 'countersigned'
  | 'cancelled';

/**
 * A signed agreement as the server stores it — the submission back, plus what
 * happened to it since. `program` is frozen at signing time, so a later change
 * to config, listing prices or the token price never moves what is shown here.
 */
export interface ResidencyAgreement
  extends Omit<ResidencyAgreementSubmission, 'stay' | 'program'> {
  _id: string;
  /** Null when the volunteer houses themselves off site: there is no booking. */
  stayId: string | null;
  status: ResidencyAgreementStatus;
  /** The volunteer who signed it. */
  createdBy: string;
  created: string;
  updated?: string;
  /** The association's own computation, frozen at signing. Render this one. */
  program: ResidencyProgram;
  countersignedBy?: string | null;
  countersignedAt?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  /** Why participation ended, in the leaver's own words. */
  cancelReason?: string | null;
}

/** What `POST /residencies/apply` and the two actions on one hand back. */
export interface ResidencyAgreementResult {
  agreement: ResidencyAgreement;
  /** The booking, or null for a volunteer who houses themselves. */
  stay: { _id: string; status: string } | null;
}
