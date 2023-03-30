export const user = {
  screenname: 'VV',
  timezone: 'Asia/Almaty',
  slug: 'vv',
  tagline: '',
  about: 'srwer',
  email: 'vashnev13@gmail.com',
  email_verified: false,
  lastactive: '2023-03-23T10:08:36.178Z',
  lastlogin: '2023-03-24T07:03:00.985Z',
  roles: [],
  viewChannels: [],
  manageChannels: [],
  location: {
    type: 'Point',
    coordinates: [76.9167, 43.25],
    timezone: 'Asia/Almaty',
    source: 'IP',
    iso_code: '',
    name_long: 'Almaty, ',
    name: 'Almaty',
  },
  settings: { newsletter_weekly: true },
  links: [],
  visibleBy: [],
  createdBy: null,
  updated: '2023-03-23T13:08:36.649Z',
  created: '2023-03-23T10:08:36.178Z',
  attributes: [],
  managedBy: [],
  _id: '641c2524f72ea12f5e9ab85d',
};

export const bookingSettings = {
  utilityFiat: { val: 10, cur: 'EUR' },
  utilityToken: { val: 0.01, cur: 'ETH' },
  checkinTime: 14,
  checkoutTime: 11,
  maxDuration: 180,
  minDuration: 1,
  conditions: {
    member: { maxDuration: 180, maxBookingHorizon: 365 },
    guest: { maxDuration: 14, maxBookingHorizon: 30 },
  },
  discounts: { daily: 0, weekly: 0.3, monthly: 0.5, highseason: 0.3 },
  cancellationPolicy: {
    lastday: 0.5,
    lastweek: 0.5,
    lastmonth: 0.75,
    default: 1,
  },
  questions: [
    { type: 'text', name: 'What brings you to Closer?', required: true },
    { type: 'text', name: 'Do you have any dietary needs?' },
    {
      type: 'select',
      name: 'How do you like your mattress?',
      options: ['soft', 'medium', 'hard'],
    },
  ],
};

export const booking = {
  status: 'open',
  listing: '609d72f9a460e712c32a1c4b',
  start: '2023-03-30T00:00:00.000Z',
  end: '2023-04-02T00:00:00.000Z',
  duration: 2,
  adults: 1,
  children: 0,
  infants: 0,
  pets: 0,
  useTokens: false,
  utilityFiat: {
    cur: 'EUR',
    val: 20,
  },
  rentalFiat: {
    cur: 'EUR',
    val: 60,
  },
  rentalToken: {
    cur: 'TDF',
    val: 1,
  },
  dailyUtilityFiat: {
    cur: 'EUR',
    val: 10,
  },
  dailyRentalToken: {
    cur: 'TDF',
    val: 0.5,
  },
  fields: [
    {
      'What brings you to Closer?': 'ads',
    },
    {
      'Do you have any dietary needs?': '',
    },
    {
      'How do you like your mattress?': '',
    },
  ],
  visibleBy: [],
  createdBy: '63fc8e8910354e3f945e249a',
  updated: '2023-03-27T22:00:36.005Z',
  created: '2023-03-27T22:00:32.548Z',
  attributes: [],
  managedBy: [],
  _id: '64221200f72ea12f5e9ab86d',
};

export const listing = {
  name: 'Van parking space',
  category: 'van',
  photos: [],
  slug: 'van-parking-space',
  description: 'Come and park your van at TDF',
  fiatPrice: {
    cur: 'EUR',
    val: 30,
  },
  tokenPrice: {
    cur: 'TDF',
    val: 0.5,
  },
  rooms: 1,
  beds: 1,
  quantity: 8,
  private: false,
  visibleBy: [],
  createdBy: '5dffdf4d9d2f1035a1e8ada1',
  updated: '2023-03-14T23:48:36.831Z',
  created: '2021-05-13T18:42:01.928Z',
  attributes: [],
  managedBy: [],
  _id: '609d72f9a460e712c32a1c4b',
};