export type VillageStatus =
  | 'planning'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type VillageVerificationBadge =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'resonant';

export type VillageOnboardingStatus =
  | 'map_only'
  | 'pre_assessed'
  | 'subscribed'
  | 'deploy_requested'
  | 'deploying'
  | 'live'
  | 'intro_scheduled';

export type VillageCapacity = {
  residents?: number;
  visitors?: number;
  events?: number;
};

export type VillageContact = {
  email?: string;
  phone?: string;
  social?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
};

export type VillageManagerInfo = {
  name?: string;
  email?: string;
  role?: string;
};

export type VillageCriteria = {
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

export type VillageDeployRequest = {
  status?: 'none' | 'requested' | 'approved' | 'rejected' | 'completed';
  requestedAt?: string;
  requestedBy?: string;
  notes?: string;
  processedAt?: string;
  processedBy?: string;
};

export type VillageSubscription = {
  status?: 'none' | 'trialing' | 'active' | 'past_due' | 'cancelled';
  planPriceEur?: number;
  trialStartedAt?: string;
  subscribedAt?: string;
  stripeSubscriptionId?: string;
};

export type Village = {
  _id: string;
  slug?: string;
  name: string;
  closer: boolean;
  description: string;
  tags: string[];
  country: string;
  website?: string;
  appUrl?: string;
  coords: [number, number];
  status: VillageStatus;
  capacity?: VillageCapacity;
  amenities?: string[];
  contact?: VillageContact;
  referredBy?: string | null;
  ambassadorId?: string | null;
  verificationBadge?: VillageVerificationBadge;
  onboardingStatus?: VillageOnboardingStatus;
  criteria?: VillageCriteria;
  projectManager?: VillageManagerInfo;
  deployRequest?: VillageDeployRequest;
  platformSubscription?: VillageSubscription;
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
  distance?: number;
};

export type VillageMapItem = {
  _id?: string;
  slug?: string;
  name: string;
  closer?: boolean;
  description: string;
  tags: string[];
  country: string;
  website?: string;
  coords: [number, number];
  verificationBadge?: VillageVerificationBadge;
  onboardingStatus?: VillageOnboardingStatus;
};

export type VillageSearchParams = {
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sort?: string;
  status?: VillageStatus;
  country?: string;
  tags?: string;
  closer?: boolean;
};

export type VillageSearchResponse = {
  villages: Village[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type CreateVillageInput = {
  name: string;
  description: string;
  tags?: string[];
  country: string;
  website?: string;
  coords: [number, number];
  status?: VillageStatus;
  capacity?: VillageCapacity;
  amenities?: string[];
  contact?: VillageContact;
  criteria?: VillageCriteria;
  projectManager?: VillageManagerInfo;
  referredBy?: string;
  ambassadorId?: string;
  managedBy?: string[];
  verificationBadge?: VillageVerificationBadge;
  onboardingStatus?: VillageOnboardingStatus;
};
