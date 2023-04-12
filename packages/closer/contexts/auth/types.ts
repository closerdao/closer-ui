export type User = {
  screenname: string;
  timezone: string;
  slug: string;
  email: string;
  walletAddress: string;
  nonce: string;
  email_verified: boolean;
  photo: string;
  lastactive: string;
  lastlogin: string;
  roles: string[];
  viewChannels: string[];
  manageChannels: string[];
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
  subscription: any
};

export type AuthenticationContext = {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  setAuthentification: (user: User, token: string) => void;
  isLoading: boolean;
  logout: () => void;
  error: string | null;
  signup: (data: unknown) => Promise<User | undefined>;
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
  setError: (msg: string) => void;
};

// isAuthenticated: !!user,
// user,
// login,
// setAuthentification,
// isLoading,
// logout,
// error,
// signup,
// completeRegistration,
// updatePassword,
// setUser,
// setError,
