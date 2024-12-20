export type User = {
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
  links: string[];
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;
  subscription: {
    plan: string;
    tier: string;
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
};

export type AuthenticationContext = {
  isAuthenticated: boolean;
  user: User | null;
  login: ({ email, password, isGoogle, idToken }: { email: string; password?: string; isGoogle?: boolean, idToken?: string | undefined}) => Promise<void>;
  setAuthentification: (user: User, token: string) => void;
  isLoading: boolean;
  logout: () => void;
  error: string | null;
  signup: (data: unknown) => Promise<{result: string | null}>;
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
  authGoogle: () => Promise<{result: string | null}>;
};
