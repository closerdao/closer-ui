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
  ticketOption?: TicketOption
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
};

export type Booking = {
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
  eventPrice?: Price<CloserCurrencies.EUR | CloserCurrencies.TDF | CloserCurrencies.ETH>;
  eventDiscount?: Discount;

  total: Price<
    CloserCurrencies.EUR | CloserCurrencies.TDF | CloserCurrencies.ETH
  >;
  isDayTicket: boolean;
  eventFiat: Price<CloserCurrencies.EUR>;

};
