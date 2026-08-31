import { VolunteerInfo } from './booking';
import type { AccommodationDiscount } from './durationDiscount';

export type StayStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'pending-payment'
  | 'paid'
  | 'cancelled'
  | 'rejected'
  | 'tokens-staked'
  | 'credits-paid';

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

export type StayTokenStakePlan = {
  dailyValue: number;
  pricePerNightWei: string;
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

export type BackendTokenStakePlan = {
  dates: number[][];
  pricePerNightWei: string;
  totalWei: string;
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

export type PendingExtension = {
  end: string;
  duration: number;
  requestedAt: string;
  requestedBy: string;
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
  fiatPaid?: StayMoney;
  creditsPaid?: StayMoney;
  tokensStaked?: StayMoney;
  appliedCredits?: StayMoney;
  appliedTokens?: StayMoney;

  pendingExtension?: PendingExtension;
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
