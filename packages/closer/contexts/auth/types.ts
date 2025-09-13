import { Charge } from '../../types/booking';
export interface UserLink {
  name: string;
  url: string;
  _id?: string;
}

export interface Vouched {
  vouchedBy: string;
  vouchedAt: Date;
}
export type Report = {
  reportedBy: string;
  reportedAt: Date;
  report: { reason: string; unsafe: boolean };
};

export type User = {
  vouched?: Vouched[];
  reports?: Report[];
  message?: string;
  tagline?: string;
  about?: string;
  stats: any;
  screenname: string;
  timezone: string;
  slug: string;
  email: string;
  phone: string;
  walletAddress: string;
  nonce: string;
  email_verified: boolean;
  kycPassed: boolean;
  photo: string;
  lastactive: string;
  lastlogin: string;
  roles: string[];
  viewChannels: string[];
  manageChannels: string[];
  preferences: {
    diet?: string | string[];
    sharedAccomodation?: string;
    superpower?: string;
    skills?: string[];
    dream?: string;
    needs?: string;
    moreInfo?: string;
  };
  location: {
    name: string;
    name_long: string;
    iso_code: string;
    source: string;
    timezone: string;
    coordinates: number[];
    type: string;
  };
  type: string;
  settings: {
    newsletter_weekly: boolean;
  };
  links: UserLink[];
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;
  citizenship?: {
    createdAt?: Date;
    appliedAt?: Date;
    status?: 'pending-payment' | 'cancelled' | 'paid' | 'completed';
    iban?: string;
    why?: string;
    tokensToFinance?: number;
    totalToPayInFiat?: number;
    monthlyPaymentAmount?: number;
    charges: Charge[];
    downPaymentAmount?: number;
  };
  subscription: {
    plan: string;
    tier: string;
    created?: Date;
    validUntil?: Date;
    cancelledAt?: Date;
    priceId: string;
    monthlyPrice: { val: number; cur: string };
    monthlyCredits: number;
    stripeCustomerEmail: string;
  };
  presence?: number;
  tokensBought?: number;
  volunteeringPresence?: number;
  isVoter?: boolean;
  socialShare?: boolean;
  referrals?: number;
  actions?: any;
  affiliate?: Date
};

export type AuthenticationContext = {
  isAuthenticated: boolean;
  user: User | null;
  login: ({
    email,
    password,
    isGoogle,
    idToken,
  }: {
    email: string;
    password?: string;
    isGoogle?: boolean;
    idToken?: string | undefined;
  }) => Promise<void>;
  setAuthentification: (user: User, token: string) => void;
  isLoading: boolean;
  logout: () => void;
  error: string | null;
  signup: (data: unknown) => Promise<{ result: string | null }>;
  completeRegistration: (
    signup_token: string,
    data: unknown,
    onSuccess: () => void,
  ) => Promise<User | undefined>;
  updatePassword: (
    reset_token: string,
    password: string,
    onSuccess: (status: string) => void,
  ) => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (msg: string | null) => void;
  loadUserFromCookies: () => Promise<void>;
  refetchUser: () => Promise<void>;
  hasSignedUp: boolean;
  isGoogleLoading: boolean;
  authGoogle: () => Promise<{ result: string | null }>;
};
