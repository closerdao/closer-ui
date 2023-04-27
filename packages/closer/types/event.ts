import { CloserCurrencies } from './currency';

export type Event = {
  name: string;
  stripePub: string;
  recording: string;
  rep: any[];
  password: string;
  photo: string;
  slug: string;
  description: string;
  participationGuideUrl: string;
  ticket: string;
  virtual?: boolean;
  paid: boolean;
  blocksBookingCalendar: boolean;
  location: string;
  address: string;
  attendees: string[];
  speakers: string[];
  ticketOptions: TicketOption[];
  fields: Field[];
  partners: Partner[];
  transportOptions: TransportOption[];
  discounts: Discount[];
  capacity: number;
  used: string;
  start: string;
  end: string;
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;
  visual?: string
};
export type TicketOption = {
  name: string;
  icon: unknown | null;
  price: number;
  currency: CloserCurrencies;
  disclaimer: string;
  limit: number;
  _id: string;
  available: number;
  isDayTicket: boolean
};

export type Field = {
  name: string;
  fieldType: string;
  _id: string;
  options: string[];
};

export type Partner = {
  name: string;
  description: string;
  image: string;
  url: string;
  _id: string;
};

export type TransportOption = {
  name: string;
  description: string;
  price: number;
  _id: string;
};

export type Discount = {
  name: string;
  code: string;
  percent: number | null;
  val: number | null;
  _id: string;
};
