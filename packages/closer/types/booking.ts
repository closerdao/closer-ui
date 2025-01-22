import { BookingConfig } from './api';
import { CloserCurrencies, Price } from './currency';
import { Discount, TicketOption } from './event';

// we set those as url params on
// - /bookings/create/dates
// - /bookings/create/accomodation
export interface BaseBookingParams {
  eventId?: string;
  volunteerId?: string;
  start?: string;
  end?: string;
  adults?: string;
  kids?: string;
  infants?: string;
  pets?: string;
  currency?: CloserCurrencies;
  ticketName?: string;
  discountCode?: string;
  ticketOption?: TicketOption;
  useTokens?: boolean | undefined;
  doesNeedPickup?: boolean | undefined;
  doesNeedSeparateBeds?: boolean | undefined;
  foodOption?: string | undefined;
  skills?: string | undefined;
  diet?: string | undefined;
  projectId?: string | undefined;
  suggestions?: string | undefined;
  bookingType?: 'volunteer' | 'residence' | undefined;
}

export type Listing = {
  name: string;
  category: string;
  photos: string[];
  slug: string;
  description: string;
  fiatPrice: Price<CloserCurrencies.EUR>;
  tokenPrice: Price<CloserCurrencies.TDF | CloserCurrencies.ETH>;
  rooms: number;
  beds: number;
  quantity: number;
  private: boolean;
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;
  availableFor?: string[];
  priceDuration?: string;
  workingHoursStart?: number;
  workingHoursEnd?: number;
  fiatHourlyPrice?: Price<CloserCurrencies.EUR>;
  tokenHourlyPrice?: Price<CloserCurrencies.TDF>;
};

export type SubscriptionChargeMeta = {
  subscriptionPlan: string;
  monthlyCredits: number;
  priceId: string;
  stripeChargeUrl: string;
};

export type TokenSaleChargeMeta = {
  txId: string;
  unitPrice: number;
  tokensPurchased: number;
  country: string;
  address: string;
  legalName: string;
  walletAddress: string;
};

export type Charge = {
  id: string;
  status: 'paid' | 'refunded' | 'pending-refund';
  method: 'stripe' | 'tokens' | 'credits' | 'crypto' | 'monerium';
  type: 'booking' | 'subscription' | 'product' | 'tokenSale' | 'financedToken';
  date: Date;
  amount: {
    total: {
      val: number;
      cur: CloserCurrencies;
    };
    rental?: { val: number; cur: CloserCurrencies };
    food?: { val: number; cur: CloserCurrencies };
    utilities?: { val: number; cur: CloserCurrencies };
    event?: { val: number; cur: CloserCurrencies };
    totalRefunded?: {
      val: number;
      cur: CloserCurrencies;
    };
  };
  referredBy?: string;
  affiliateRevenue?: { val: number; cur: CloserCurrencies };
  meta: {
    stripePaymentIntentId?: string;
    stripeConnectFee?: number;
    stripeProcessingFee?: number;
    txId?: string;
    isTokenRefund?: boolean;
    stripeConnectFeeRefunded?: number;
    fractionToRefund?: number;
  } & Partial<SubscriptionChargeMeta> &
    Partial<TokenSaleChargeMeta>;
};

// export type Charge = BasicCharge & {
//   type: 'booking' | 'subscription' | 'product';
//   bookingId: string;
//   createdBy: string;
// };

export type VolunteerInfo = {
  skills?: string[];
  diet?: string[];
  projectId?: string[];
  suggestions?: string;
  bookingType?: 'volunteer' | 'residence' | undefined;
};

export type Booking = {
  foodOption?: string;
  foodOptionId?: string;
  status: string;
  listing: string;
  start: string;
  end: string;
  duration: number;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  useTokens: boolean;
  useCredits: boolean;
  utilityFiat: Price<CloserCurrencies.EUR>;
  foodFiat: Price<CloserCurrencies.EUR>;
  rentalFiat: Price<CloserCurrencies.EUR>;
  rentalToken: Price<CloserCurrencies.TDF | CloserCurrencies.ETH>;
  dailyUtilityFiat: Price<CloserCurrencies.EUR>;
  dailyRentalToken: Price<CloserCurrencies.TDF | CloserCurrencies.ETH>;
  fields: { [key: string]: string }[];
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;

  ticketOption?: TicketOption;
  eventId: string;
  volunteerId: string;
  eventPrice?: Price<
    CloserCurrencies.EUR | CloserCurrencies.TDF | CloserCurrencies.ETH
  >;
  eventDiscount?: Discount;

  total: Price<
    CloserCurrencies.EUR | CloserCurrencies.TDF | CloserCurrencies.ETH
  >;
  isDayTicket: boolean;
  eventFiat: { val: 0; cur: CloserCurrencies.EUR; _id: string };
  doesNeedSeparateBeds?: boolean;
  doesNeedPickup?: boolean;
  isTeamBooking?: boolean;
  paymentDelta?: {
    fiat: { val: number; cur: CloserCurrencies.EUR };
    token?: { val: number; cur: CloserCurrencies.TDF };
    credits?: { val: number; cur: 'credits' };
  } | null;
  roomNumber?: number;
  adminBookingReason?: string;
  roomOrBedNumbers?: number[];
  charges?: Charge[];
  volunteerInfo?: VolunteerInfo;
};

export interface StatusColor {
  [key: string]: string;
}

export interface BookingWithUserAndListing {
  _id: string;
  start: number | Date;
  end: number | Date;
  adults: number;
  userInfo: {
    name: string;
    photo: string;
  };
  listingId: string;
  fiatPriceVal: number;
  fiatPriceCur: CloserCurrencies;
  roomOrBedNumbers?: number[];
  adminBookingReason?: string;
}

export interface AccommodationUnit {
  id: number;
  title: string;
  listingId: string;
}

export interface BookingItem {
  id: string;
  group: number;
  title: string;
  start_time: Date;
  end_time: Date;
  roomOrBedNumbers?: number[];
}

export type NightlyBookingByListing = {
  listingName: string;
  roomOrBedNumber: number;
  nights: number;
  totalNights: number;
};

export type SpaceBookingByListing = {
  listingName: string;
  roomOrBedNumber: number;
  spaceSlots: number;
  totalSpaceSlots: number;
};

export interface ListingByType {
  listingName: string;
  roomOrBedNumber: number;
  nights?: number;
  spaceSlots?: number;
  totalNights?: number;
  totalSpaceSlots?: number;
}

export interface Filter {
  where: { [key: string]: any };
  limit?: number;
  start?: DateRangeFilter;
  sort_by?: string;
}

export interface DateRangeFilter {
  $lte?: Date;
  $gte?: Date;
}

export type FiatTotalParams = {
  foodPrice?: number;
  isTeamBooking: boolean;
  eventTotal?: number;
  utilityTotal: number;
  foodTotal: number;
  accommodationFiatTotal: number;
  useTokens?: boolean;
  useCredits?: boolean;
};

export type UtilityTotalParams = {
  utilityFiatVal: number | undefined;
  updatedAdults: number;
  updatedDuration: number;
  discountRate: number;
  isTeamBooking: boolean | undefined;
  isUtilityOptionEnabled: boolean;
};

export type FoodPriceParams = {
  foodOption: string;
  isTeamBooking: boolean | undefined;
  isFood: boolean;
  adults: number | undefined;
  duration: number | undefined;
  eventId: string | undefined;
  bookingConfig: BookingConfig | undefined | null;
};
export enum PaymentType {
  FIAT = 'fiat',
  FULL_TOKENS = 'fullTokens',
  FULL_CREDITS = 'fullCredits',
  PARTIAL_TOKENS = 'partialTokens',
  PARTIAL_CREDITS = 'partialCredits',
}
export type UpdatedPrices = {
  rentalFiat: Price<CloserCurrencies.EUR>;
  rentalToken: Price<CloserCurrencies.TDF>;
  eventFiat: Price<CloserCurrencies.EUR>;
  foodFiat: Price<CloserCurrencies.EUR>;
  utilityFiat: Price<CloserCurrencies.EUR>;
  total: Price<CloserCurrencies.EUR>;
};

export type DynamicField = {
  name: string;
  options: { label: string; value: string }[] | string[];
};
