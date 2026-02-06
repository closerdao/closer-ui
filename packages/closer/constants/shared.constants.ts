import { blockchainConfig } from '../config_blockchain';
import { CloserCurrencies } from '../types/currency';


export const taxExemptionReasons = [
  {
    id: '1',
    description: 'Artigo 16.º, n.º 6 do CIVA',
    law: 'Artigo 16.º, n.º 6, alíneas a) a d) do CIVA',
  },
  {
    id: '2',
    description: 'Artigo 6.º do Decreto-Lei n.º 198/90, de 19 de junho',
    law: 'Artigo 6.º do Decreto-Lei n.º 198/90, de 19 de  junho',
  },
  {
    id: '3',
    description: 'Exigibilidade de caixa',
    law: 'Decreto-Lei n.º 204/97, de 9 de agosto',
  },
  {
    id: '4',
    description: 'Exigibilidade de caixa',
    law: 'Decreto-Lei n.º 418/99, de 21 de outubro',
  },
  {
    id: '5',
    description: 'Exigibilidade de caixa',
    law: 'Lei n.º 15/2009, de 1 de abril',
  },
  {
    id: '6',
    description: 'Isento artigo 13.º do CIVA',
    law: 'Artigo 13.º do CIVA',
  },
  {
    id: '7',
    description: 'Isento artigo 14.º do CIVA',
    law: 'Artigo 14.º do CIVA',
  },
  {
    id: '8',
    description: 'Isento artigo 15.º do CIVA',
    law: 'Artigo 15.º do CIVA',
  },
  {
    id: '9',
    description: 'Isento artigo 9.º do CIVA',
    law: 'Artigo 9.º do CIVA',
  },
  {
    id: '10',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea i), j) ou l) do CIVA',
  },
  {
    id: '11',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea j) do CIVA',
  },
  {
    id: '12',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º do CIVA',
  },
  {
    id: '13',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea l) do CIVA',
  },
  {
    id: '14',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 21/2007, de 29 de janeiro',
  },
  {
    id: '15',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 362/99, de 16 de setembro',
  },
  {
    id: '17',
    description: 'IVA - não confere direito a dedução',
    law: 'Artigo 62.º alínea b) do CIVA',
  },
  {
    id: '18',
    description: 'IVA - regime de isenção',
    law: 'Artigo 57.º do CIVA',
  },
  {
    id: '19',
    description: 'Regime particular do tabaco',
    law: 'Decreto-Lei n.º 346/85, de 23 de agosto',
  },
  {
    id: '20',
    description: 'Regime da margem de lucro - Agências de viagens',
    law: 'Decreto-Lei n.º 221/85, de 3 de julho',
  },
  {
    id: '21',
    description: 'Regime da margem de lucro - Bens em segunda mão',
    law: 'Decreto-Lei n.º 199/96, de 18 de outubro',
  },
  {
    id: '22',
    description: 'Regime da margem de lucro - Objetos de arte',
    law: 'Decreto-Lei n.º 199/96, de 18 de outubro',
  },
  {
    id: '23',
    description:
      'Regime da margem de lucro - Objetos de coleção e antiguidades',
    law: 'Decreto-Lei n.º 199/96, de 18 de outubro',
  },
  {
    id: '24',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º n.º 6 alínea a) do CIVA',
  },
  {
    id: '25',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º n.º 11 do CIVA',
  },
  {
    id: '26',
    description: 'Isento artigo 14.º do RITI',
    law: 'Artigo 14.º do RITI',
  },
  {
    id: '28',
    description: 'Não sujeito ou não tributado',
    law: 'Outras situações de não liquidação do imposto (Exemplos: artigo 2.º, n.º 2 ; artigo 3.º, n.ºs 4, 6 e 7; artigo 4.º, n.º 5, todos do CIVA)',
  },
  {
    id: '29',
    description: 'IVA - autoliquidação',
    law: 'Artigo 8.º do RITI',
  },
  {
    id: '63',
    description: 'IVA - regime forfetário',
    law: 'Artigo 59.º-D n.º2 do CIVA',
  },
  {
    id: '64',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea m) do CIVA',
  },
  {
    id: '65',
    description: 'IVA – Isenção prevista na Lei n.º 13/2020, de 7 de maio',
    law: 'Lei n.º 13/2020 de 7 de Maio 2020',
  },
  {
    id: '66',
    description:
      'IVA - Isenção no nº 1 do art. 4º da Lei nº 10A/2022, de 28 de abril',
    law: 'Lei nº 10A/2022 de 28 de abril',
  },
  {
    id: '143',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 362/99, de 16 de setembro',
  },
  {
    id: '132',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea l) do CIVA',
  },
  {
    id: '131',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea j) do CIVA',
  },
  {
    id: '130',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea i) do CIVA',
  },
  {
    id: '125',
    description: 'Mercadorias à consignação',
    law: 'Artigo 38.º n.º 1 alínea a)',
  },
  {
    id: '121',
    description: 'IVA - não confere direito à dedução (ou expressão similar)',
    law: 'Artigo 72.º n.º 4 do CIVA',
  },
  {
    id: '119',
    description: 'Outras isenções',
    law: 'Isenções temporárias determinadas em diploma próprio',
  },
  {
    id: '140',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º n.º 6 alínea a) do CIVA, a contrário',
  },
  {
    id: '141',
    description: 'IVA - autoliquidação',
    law: 'Artigo 8.º n.º 3 do RITI',
  },
  {
    id: '142',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 21/2007, de 29 de janeiro',
  },
  {
    id: '133',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea m) do CIVA',
  },
  {
    id: '152',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea n) do CIVA',
  },
  {
    id: '151',
    description: 'Isenção de IVA com direito à dedução no cabaz alimentar',
    law: 'Lei n.º 17/2023, de 14 de abril',
  },
];

export const SHARED_ACCOMMODATION_PREFERENCES = [
  { label: 'Flexible', value: 'flexible' },
  { label: 'Male Only', value: 'male only' },
  { label: 'Female Only', value: 'female only' },
];

export const REFUND_PERIODS = {
  MONTH: 30,
  WEEK: 7,
  DAY: 1,
  LASTDAY: 0,
};

export const BOOKING_STEPS = [
  'dates',
  'accomodation',
  'food',
  'rules',
  'questions',
  'summary',
  'checkout',
];

export const BOOKING_STEP_TITLE_KEYS = [
  'bookings_progress_step_dates',
  'bookings_progress_step_accomodation',
  'bookings_progress_step_food',
  'bookings_progress_step_rules',
  'bookings_progress_step_questions',
  'bookings_progress_step_summary',
  'bookings_progress_step_checkout',
];
export const PRODUCT_SALE_STEPS = [
  'learn',
  'checkout',
  'confirmation',
];

export const CURRENCIES: CloserCurrencies[] = [
  CloserCurrencies.EUR,
  CloserCurrencies.TDF,
  // blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
];

export const CURRENCIES_WITH_LABELS = [
  {
    value: CloserCurrencies.EUR,
    label: 'Euros',
    symbol: '€',
  },
  process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true'
    ? {
        value: blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
        label: `${blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}`,
        symbol: `$${blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}`,
      }
    : {
        value: 'credits',
        label: 'credits',
        symbol: 'credits',
      },
];

export const SUBSCRIPTION_STEPS = [
  'subscriptions',
  'summary',
  'checkout',
  'success',
];

export const SUBSCRIPTION_CITIZEN_STEPS = [
  'why',
  'validation',
  'success',
];

export const TOKEN_SALE_STEPS = [
  'before-you-begin',
  'checklist-crypto',
  'nationality',
  'checkout',
  'success',
];

export const TOKEN_SALE_STEPS_BANK_TRANSFER = [
  'before-you-begin',
  'nationality',
  'bank-transfer',
  'success',
];

export const DEFAULT_CURRENCY = CloserCurrencies.EUR; // EUR
export const REFERRAL_ID_LOCAL_STORAGE_KEY = 'referredByUserId';

export const BOOKING_STATUS_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Paid', value: 'paid' },
  { label: 'Tokens-staked', value: 'tokens-staked' },
  { label: 'Credits-paid', value: 'credits-paid' },
  { label: 'Checked-in', value: 'checked-in' },
  { label: 'Checked-out', value: 'checked-out' },
];

export const BOOKING_TYPE_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Volunteering', value: 'volunteer' },
  { label: 'Residency', value: 'residency' },
  { label: 'Event', value: 'event' },
  { label: 'Stay', value: 'stay' },
];

export const USER_ROLE_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Admin', value: 'admin' },
  { label: 'Content-creator', value: 'content-creator' },
  { label: 'Event creator', value: 'event-creator' },
  { label: 'Space host', value: 'space-host' },
  { label: 'Steward', value: 'steward' },
  { label: 'Community-curator', value: 'community-curator' },
  { label: 'Affiliate manager', value: 'affiliate-manager' },
  { label: 'Team', value: 'team' },
  { label: 'Accounting', value: 'accounting' },
  { label: 'Member', value: 'member' },
];

export const USER_MEMBER_STATUS_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Member', value: 'member' },
  { label: 'Not member', value: 'Not Memebr' },
];

export const ACTIONS = [
  { label: 'Send carrots', value: 'Send carrots' },
  { label: 'Export selected (CSV)', value: 'Export selected (CSV)' },
  { label: 'Add role', value: 'Add role' },
  { label: 'Remove role', value: 'Remove role' },
  { label: 'Copy emails', value: 'Copy emails' },
  { label: 'Unlink wallet', value: 'Unlink wallet' },
];

export const SUBSCRIPTION_TIER_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Explorer', value: 'explorer' },
  { label: 'Wanderer', value: 'wanderer' },
  { label: 'Pioneer', value: 'pioneer' },
  { label: 'Sheep', value: 'sheep' },
];

export const USER_CREATED_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Last week', value: 'last-week' },
  { label: 'Last month', value: 'last-month' },
  { label: 'Last 3 months', value: 'last-3-months' },
  { label: 'Last 6 months', value: 'last-6-months' },
];

export const USER_SORT_OPTIONS = ['-created', 'screenname'];
export const USER_SORT_TITLE_OPTIONS = ['Newest first', 'Name'];

export const INVESTMENT_COMPARISON = [
  {
    amount: '€1,100',
    renting: {
      term: ['1 Month'],
      extraCosts: ['Food - €500', 'Utility - €200', 'Co-working - €400'],
    },
    tdf: {
      term: ['~4 $TDF', '4 days per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€3,300',
    renting: {
      term: ['3 Months'],
      extraCosts: [
        'Food - €500 x 3',
        'Utility - €200 x 3',
        'Co-working - €400 x 3',
      ],
    },
    tdf: {
      term: ['~14 $TDF', '2 weeks per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€7,000',
    renting: {
      term: ['6 Months'],
      extraCosts: [
        'Food - €500 x 6',
        'Utility - €200 x 6',
        'Co-working - €400 x 6',
      ],
    },
    tdf: {
      term: ['~30 $TDF', '1 month per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€21,000',
    renting: {
      term: ['19 Months'],
      extraCosts: [
        'Food - €500 x 19',
        'Utility - €200 x 19',
        'Co-working - €400 x 19',
      ],
    },
    tdf: {
      term: ['~90 $TDF', '3 months per year'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '€84,680',
    renting: {
      term: ['6 years'],
      extraCosts: [
        'Food - €500 x 72',
        'Utility - €200 x 72',
        'Co-working - €400 x 72',
      ],
    },
    tdf: {
      term: ['~365 $TDF', 'You just Got a full time home!'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
  {
    amount: '278,000',
    renting: {
      term: ['Finally Bought a home!'],
      extraCosts: ['Food - €500', 'Utility - €200', 'Co-working - €400'],
    },
    tdf: {
      term: ['You spend the rest on building regen startups'],
      extraCosts: [
        'Food: Included',
        'Utility: €12 p/day',
        'Co-working: Included',
      ],
    },
  },
];

export const BONDING_CURVE = {
  COEFFICIENTS: {
    a: -11680057722,
    b: 32000461777723,
    c: 420,
  },
};

export const SALES_CONFIG = {
  MAX_WALLET_BALANCE: 1500,
  MAX_TOKENS_PER_TRANSACTION: 100,
};

export const MIN_CELO_FOR_GAS = 1;

export const BOOKING_EXISTS_ERROR =
  'execution reverted: BookingFacet: Booking already exists';
export const USER_REJECTED_TRANSACTION_ERROR = 'user rejected transaction';

export const MAX_BOOKINGS_TO_FETCH = 3000;
export const BOOKINGS_PER_PAGE = 36;

export const MAX_CREDITS_PER_MONTH = 90;

export const HOME_PAGE_CATEGORY = 'home page';

export const MAX_USERS_TO_FETCH = 3000;

export const MAX_LISTINGS_TO_FETCH = 100;

export const DEFAULT_AVAILABILITY_RANGE_TO_CHECK = 120;

export const paidStatuses = [
  'paid',
  'tokens-staked',
  'credits-paid',
  'checked-in',
  'checked-out',
];
export const dashboardRelevantStatuses = [
  ...paidStatuses,
  'pending',
  'confirmed',
];

export const STRIPE_AMOUNT_MULTIPLIER = 100;

export const GNOSIS_SAFE_ADDRESS = '0x5E810b93c51981eccA16e030Ea1cE8D8b1DEB83b';
export const BLOG_POSTS_PER_PAGE = 9;

export const DEFAULT_BLOG_IMAGE_ID = '66a7da14aca528c59057785e';
