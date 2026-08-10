export type LandProjectStatus =
  | 'planning'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type LandProjectVerificationBadge =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'resonant';

export type LandProjectOnboardingStatus =
  | 'map_only'
  | 'pre_assessed'
  | 'subscribed'
  | 'deploy_requested'
  | 'deploying'
  | 'live'
  | 'intro_scheduled';

export type ProjectApiStatus =
  | 'active'
  | 'suspended'
  | 'maintenance'
  | 'cancelled';

export type ProjectApiServerTier = 'mini' | 'medium' | 'large';

export type LandProjectCapacity = {
  residents?: number;
  visitors?: number;
  events?: number;
};

export type LandProjectContact = {
  email?: string;
  phone?: string;
  social?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
};

export type LandProjectManagerInfo = {
  name?: string;
  email?: string;
  role?: string;
};

export type LandProjectCriteria = {
  landBased?: boolean;
  hasLand?: boolean;
  peopleOnLand?: boolean;
  operationalized?: boolean;
  peopleCount?: number;
  roomsCount?: number;
  notTechnophobic?: boolean;
  monthlyVolumeEur?: number;
  ecologicalFocus?: boolean;
  regenerativeCulture?: boolean;
  web3Openness?: boolean;
};

export type LandProjectDeployRequest = {
  status?: 'none' | 'requested' | 'approved' | 'rejected' | 'completed';
  requestedAt?: string;
  requestedBy?: string;
  notes?: string;
  processedAt?: string;
  processedBy?: string;
};

export type LandProjectSubscription = {
  status?: 'none' | 'trialing' | 'active' | 'past_due' | 'cancelled';
  planPriceEur?: number;
  trialStartedAt?: string;
  subscribedAt?: string;
  stripeSubscriptionId?: string;
};

export type LandProject = {
  _id: string;
  slug?: string;
  name: string;
  closer: boolean;
  description: string;
  tags: string[];
  country: string;
  website?: string;
  appUrl?: string;
  apiUrl?: string;
  coords: [number, number];
  status: LandProjectStatus;
  capacity?: LandProjectCapacity;
  amenities?: string[];
  contact?: LandProjectContact;
  projectApi?: string | ProjectApi | null;
  referredBy?: string | null;
  ambassadorId?: string | null;
  verificationBadge?: LandProjectVerificationBadge;
  onboardingStatus?: LandProjectOnboardingStatus;
  criteria?: LandProjectCriteria;
  projectManager?: LandProjectManagerInfo;
  deployRequest?: LandProjectDeployRequest;
  platformSubscription?: LandProjectSubscription;
  visibility?: string;
  visibleBy?: string[];
  createdBy?: string;
  managedBy?: string[];
  attributes?: string[];
  created?: string;
  updated?: string;
  deleted?: string | null;
  creator?: {
    _id?: string;
    screenname?: string;
    slug?: string;
    photo?: string;
  };
  projectApiData?: Partial<ProjectApi>;
  distance?: number;
};

export type ProjectApiAgreement = {
  tokenFee?: number;
  txFee?: number;
  hostingFee?: number;
  setupFee?: number;
  maintenanceFee?: number;
};

export type ProjectApiStats = {
  totalUsers?: number;
  activeUsers?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
  lastUpdated?: string;
};

export type ProjectApi = {
  _id: string;
  slug?: string;
  name: string;
  description: string;
  agreement?: ProjectApiAgreement;
  deploymentDate: string;
  apiUrl: string;
  appUrl: string;
  serverTier: ProjectApiServerTier;
  privateDatabase?: boolean;
  stats?: ProjectApiStats;
  adminEmail: string;
  status: ProjectApiStatus;
  landProjects?: string[];
  referredBy?: string | null;
  createdBy?: string;
  managedBy?: string[];
  created?: string;
  updated?: string;
};

export type LandProjectMapItem = {
  _id?: string;
  slug?: string;
  name: string;
  closer?: boolean;
  description: string;
  tags: string[];
  country: string;
  website?: string;
  coords: [number, number];
  verificationBadge?: LandProjectVerificationBadge;
  onboardingStatus?: LandProjectOnboardingStatus;
};

export type LandProjectSearchParams = {
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sort?: string;
  status?: LandProjectStatus;
  country?: string;
  tags?: string;
  closer?: boolean;
};

export type LandProjectSearchResponse = {
  landProjects: LandProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type CreateLandProjectInput = {
  name: string;
  description: string;
  tags?: string[];
  country: string;
  website?: string;
  coords: [number, number];
  status?: LandProjectStatus;
  capacity?: LandProjectCapacity;
  amenities?: string[];
  contact?: LandProjectContact;
  criteria?: LandProjectCriteria;
  projectManager?: LandProjectManagerInfo;
  referredBy?: string;
  ambassadorId?: string;
  managedBy?: string[];
  verificationBadge?: LandProjectVerificationBadge;
  onboardingStatus?: LandProjectOnboardingStatus;
};
