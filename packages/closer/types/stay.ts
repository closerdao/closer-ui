import { VolunteerInfo } from './booking';
import type { AccommodationDiscount } from './durationDiscount';

export type StayStatus =
  | 'open'
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'pending-payment'
  | 'pending-refund'
  | 'paid'
  | 'cancelled'
  | 'rejected'
  | 'tokens-staked'
  | 'credits-paid'
  | 'checked-in'
  | 'checked-out';

export type StayPaymentMethod =
  | 'fiat'
  | 'partial-credits'
  | 'full-credits'
  | 'partial-tokens'
  | 'full-tokens';

export type StayMoney = {
  val: number;
  cur: string;
};

export type PriceLockLines = {
  accommodation: StayMoney;
  accommodationGross: StayMoney;
  accommodationDiscount?: StayMoney;
  accommodationDiscounted?: StayMoney;
  food: StayMoney;
  utility: StayMoney;
  event: StayMoney;
  eventToken?: StayMoney;
};

export type StayTokenStakeSegment = {
  bookingNights: number[][];
  pricePerNightWei: string;
};

export type StayTokenStakeSubmission = StayTokenStakeSegment & {
  stakedNightCountAfter: number;
};

export type StayTokenStakePlan = {
  segments: StayTokenStakeSegment[];
  totalWei: string;
  decimals: number;
  displayDecimals: number;
  bookingNights: number[][];
  tokenAmount: number;
};

export type AccommodationRailPricing = {
  gross: StayMoney;
  discountAmount: StayMoney;
  discounted: StayMoney;
  effectivePerNight: StayMoney;
  grossWei?: string;
  discountedWei?: string;
  effectivePerNightWei?: string;
  decimals?: number;
};

export type BackendTokenStakePlanSegment = {
  dates: number[][];
  pricePerNightWei: string;
};

export type BackendTokenStakePlan = {
  segments?: BackendTokenStakePlanSegment[];
  dates: number[][];
  // Only a plan whose segments share one rate carries a flat nightly price.
  pricePerNightWei?: string;
  totalWei?: string;
  total: StayMoney;
  decimals: number;
  displayDecimals: number;
};

export type PriceLock = {
  lines: PriceLockLines;
  subtotal: StayMoney;
  vat: StayMoney;
  platformFee: StayMoney;
  affiliateFee: StayMoney;
  total: StayMoney;
  dailyRentalFiat: StayMoney;
  dailyRentalToken: StayMoney;
  appliedCredits: StayMoney;
  appliedTokens: StayMoney;
  rentalToken?: StayMoney;
  durationDiscount?: AccommodationDiscount['duration'];
  accommodationDiscount?: AccommodationDiscount;
  accommodationPricing?: {
    fiat: AccommodationRailPricing;
    token: AccommodationRailPricing;
    credits: AccommodationRailPricing;
  };
  tokenStakePlan?: BackendTokenStakePlan;
  currency: string;
  lockedAt: string;
};

/** Body of `POST /stays/:id/modification`. Every field is optional; the server
 * infers the modification type from what moved. */
export type StayModificationRequest = {
  start?: string;
  end?: string;
  listingId?: string;
  adults?: number;
  children?: number;
  infants?: number;
  pets?: number;
};

/** What `POST /stays/:id/modification/confirm` reports back about the money it
 * gave back. `stripe.status` is 'noop' when nothing was paid by card. */
export type StayModificationRefund = {
  fractionToRefund?: number;
  refundVal?: number;
  breakdown?: {
    accommodation?: number;
    utility?: number;
    food?: number;
    event?: number;
  };
  stripe?: {
    status?: string;
    reason?: string;
    refundedVal?: number;
    refundId?: string;
    error?: string;
  } | null;
};

export type PendingModificationStatus =
  'pending-payment' | 'pending-approval' | 'settling' | 'expired';

export type PendingModificationType =
  'dates' | 'upgrade' | 'guests' | 'shorten';

/** One priced stretch of the proposed stay. `dates` is the token stake plan's
 * `[year, dayOfYear]` shape, so the stake helpers read a quote like a plan. */
export type PendingModificationSegment = {
  dates?: [number, number][];
  tier?: 'daily' | 'weekly' | 'monthly';
  pricePerNightWei?: string;
};

export type PendingModificationQuote = {
  fiatDelta: number;
  currency: string;
  tokensDelta?: number;
  creditsDelta?: number;
  marginalPricePerNightWei?: string;
  segments?: PendingModificationSegment[];
  priceLockPreview?: PriceLock;
};

export type PendingModificationOverrides = {
  start?: string;
  end?: string;
  duration?: number;
  listing?: string;
  adults?: number;
  children?: number;
  infants?: number;
  pets?: number;
};

/** The held quote for a proposed change. The confirmed stay is untouched while
 * it exists; `POST /stays/:id/modification/confirm` is the only thing that
 * applies it. */
export type PendingModification = {
  id: string;
  type: PendingModificationType;
  status: PendingModificationStatus;
  requestedBy?: string;
  requestedAt: string;
  /** Null on an approval request, which waits for a human rather than expiring. */
  expiresAt?: string | null;
  requiresHostApproval?: boolean;
  overrides: PendingModificationOverrides;
  quote: PendingModificationQuote;
};

export type Stay = {
  _id: string;
  status: StayStatus;
  /** Absent on day tickets, which grant event access rather than a space. */
  listing?: string | null;
  start: string;
  end: string;
  duration: number;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  isHourlyBooking?: boolean;
  isDayTicket?: boolean;
  isFriendsBooking?: boolean;
  isTeamBooking?: boolean;
  friendEmails?: string;
  eventId?: string;
  volunteerId?: string;
  volunteerInfo?: VolunteerInfo;
  ticketOption?: { name?: string } | null;
  /** PATCH options writes a bare code; the stay comes back carrying the whole
   * matched discount, so both shapes have to be read. */
  eventDiscount?: string | { code?: string } | null;
  foodOption?: string;
  foodOptionId?: string | null;
  doesNeedPickup?: boolean;
  doesNeedSeparateBeds?: boolean;
  parentBookingId?: string | null;
  message?: string;
  about?: string;
  gift?: string;
  roomOrBedNumbers?: number[];
  createdBy: string;
  /** Co-guests sharing the stay. Read-only through PATCH; see addStayGuest. */
  guests?: string[];
  created: string;
  updated: string;
  useTokens?: boolean;

  priceLock?: PriceLock;
  rentalToken?: StayMoney;
  fiatTarget?: StayMoney;
  creditsTarget?: StayMoney;
  tokensTarget?: StayMoney;
  /**
   * Set when a volunteer season reserved this stay (`POST /residencies/apply`).
   * Its dates and room are the agreement's frozen program: extend, shorten,
   * upgrade and guest changes are refused server-side, and `tokensTarget` /
   * `fiatTarget` are the only figures owed — never the price lock.
   */
  residencyAgreementId?: string | null;
  fiatPaid?: StayMoney;
  creditsPaid?: StayMoney;
  tokensStaked?: StayMoney;
  appliedCredits?: StayMoney;
  appliedTokens?: StayMoney;

  pendingModification?: PendingModification | null;
  checkedIn?: string;
  checkedOut?: string;
  numberOfUnits?: number;

  paymentDelta?: {
    fiat?: StayMoney;
    credits?: StayMoney;
    token?: StayMoney;
  } | null;
};

export type {
  AccommodationDiscount,
  StaySearchResponse,
} from './durationDiscount';

export type StayCheckoutResponse = {
  paymentIntent: {
    id: string;
    status: 'requires_action' | 'requires_confirmation' | 'succeeded' | string;
    client_secret?: string;
  } | null;
  fiatAmount: number;
  tokensAmount: number;
  creditsSpent: number;
  needsTokenStake: boolean;
};

export type StayQuoteResponse = {
  priceLock: PriceLock;
  currentTotal: StayMoney;
  delta: { fiat: StayMoney };
};

/** Step 1 of POST /stays/:id/token-payment (empty body): the transfer quote.
 * fiatAmount already excludes accommodation covered by staked tokens and
 * anything paid on other rails. */
export type StayTokenPaymentQuote = {
  fiatAmount: number;
  currency: string;
  chainId: number;
  treasuryAddress: string;
  stablecoinSymbol: string;
  stablecoinAddresses: string[];
};

/** Step 2 of POST /stays/:id/token-payment ({ txHash }). */
export type StayTokenPaymentConfirmResponse = {
  booking: Stay;
  verified: boolean;
};

export type StayEditDateBounds = {
  minExtendDate: string;
  minShortenDate: string;
  maxShortenDate: string;
  canShorten: boolean;
};

export type StayDateEditPlanParams = {
  timeZone: string | undefined;
  start: string | Date | null | undefined;
  end: string | Date | null | undefined;
  pendingStartDay: string;
  pendingEndDay: string;
};

export type StayDateEditPlan = {
  hasArrivalChange: boolean;
  endChange: 'none' | 'extend' | 'shorten';
};

/** One booking.hostChangeLog entry as GET /stays/:id/changes returns it. */
export type HostChangeEntry = {
  at: string;
  by: { _id: string; screenname: string | null };
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
};

/** booking.hostNote: hosts' coordination line, never in a guest payload. Legacy notes carry no author or time. */
export type HostNote = {
  text: string;
  updatedBy: string | null;
  updatedAt: string | null;
};

export type HostChangesPage = {
  total: number;
  page: number;
  limit: number;
  entries: HostChangeEntry[];
};

/** GET /stays/host/auto-cancel-exempt: a confirmed stay plus the change-log entry that exempts it. */
export type AutoCancelExemptStay = Stay & {
  autoCancelExemption: {
    action: string;
    at: string;
    by: string;
    reason?: string;
  };
};
