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

export type Booking = {
  foodOption: string;
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
    token: CloserCurrencies.TDF;
    fiat: CloserCurrencies.EUR;
    credits: { val: number; cur: string };
  } | null;
  roomNumber?: number;
  adminBookingReason?: string;
  roomOrBedNumbers?: number[];
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
}

export interface DateRangeFilter {
  $lte?: Date;
  $gte?: Date;
}
