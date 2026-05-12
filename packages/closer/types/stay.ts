import { VolunteerInfo } from './booking';

export type StayStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'pending-payment'
  | 'paid'
  | 'cancelled'
  | 'rejected';

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
  food: StayMoney;
  utility: StayMoney;
  event: StayMoney;
};

export type StayTokenStakePlan = {
  dailyValue: number;
  pricePerNightWei: string;
  bookingNights: number[][];
  tokenAmount: number;
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
  listing: string;
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
  created: string;
  updated: string;

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

  paymentDelta?: {
    fiat?: StayMoney;
    credits?: StayMoney;
    token?: StayMoney;
  } | null;
};

export type StaySearchAvailability = Record<string, string[]>;

export type StaySearchResponse = {
  results: any[];
  availability: StaySearchAvailability;
};

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
