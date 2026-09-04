/**
 * Coordinates carry two incompatible orders and mixing them silently drops pins
 * in the wrong country, so each one gets its own name.
 *
 * - `LngLat` is GeoJSON order and is what the API/database speaks.
 * - `LatLng` is Leaflet order and is what every map component speaks.
 *
 * Cross the boundary only through `toLeafletCoords` / `toApiCoords`.
 */
export type LngLat = [number, number];
export type LatLng = [number, number];

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

/**
 * One enum for the funnel and the deploy pipeline, in order. Closer moves a
 * village up to `deploy_requested`; procurement writes `deploying`, `failed`,
 * `live` and `suspended` straight onto the record.
 *
 * The order matters: `slug` freezes from `deploy_requested` onwards, and a
 * suspended village keeps its subdomain because that is procurement's join key.
 */
export type VillageOnboardingStatus =
  | 'map_only'
  | 'pre_assessed'
  | 'intro_scheduled'
  | 'subscribed'
  | 'deploy_requested'
  | 'deploying'
  | 'failed'
  | 'live'
  | 'suspended';

export type VillageCapacity = {
  residents?: number;
  visitors?: number;
  events?: number;
};

export type VillageSocialNetwork = 'instagram' | 'twitter' | 'facebook';

export type VillageContact = {
  email?: string;
  phone?: string;
  social?: Partial<Record<VillageSocialNetwork, string>>;
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

/**
 * Written by the API's deploy route. There is no approve/reject step — pressing
 * the CTA is the approval, so there is nobody to record as a `processedBy`.
 * `processedAt` is set by procurement when it picks the request up.
 */
export type VillageDeployRequest = {
  status?: 'none' | 'requested' | 'completed' | 'failed';
  requestedAt?: string;
  /** User id, or a populated user when the API expands it. */
  requestedBy?: string | { _id?: string; screenname?: string; email?: string };
  notes?: string;
  processedAt?: string;
};

/**
 * Tier 0→1 platform subscription. Not on the API's Village model yet — the
 * deploy route carries a `TODO(platformSubscription)` for the founder gate —
 * so treat every field as optional and absent until that lands.
 */
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
  /**
   * @deprecated Procurement writes this alongside `onboardingStatus`, so it
   * says nothing the status does not — and where the two disagree it is the
   * flag that was never updated. Ask `isVillageDeployed` instead; nothing in
   * the UI reads this any more.
   */
  closer?: boolean;
  description: string;
  tags: string[];
  country: string;
  website?: string;
  appUrl?: string;
  apiUrl?: string;
  /**
   * GeoJSON order — `[lng, lat]`. This is what the API stores and returns.
   * Convert with `toLeafletCoords` before handing it to a map.
   */
  coords: LngLat;
  status: VillageStatus;
  capacity?: VillageCapacity;
  amenities?: string[];
  contact?: VillageContact;
  /** The ambassador who brought the village in — attribution, not access. */
  referredBy?: string | null;
  /**
   * Optional alias of `referredBy` for the referring ambassador. Not on the API
   * model, so read it alongside `referredBy`, never instead of it.
   */
  ambassadorId?: string | null;
  /** The application this village was created from, when it came from one. */
  applicationId?: string;
  verificationBadge?: VillageVerificationBadge;
  onboardingStatus?: VillageOnboardingStatus;
  criteria?: VillageCriteria;
  projectManager?: VillageManagerInfo;
  deployRequest?: VillageDeployRequest;
  /** Procurement-written: the last provisioning error, or null. */
  deployError?: string | null;
  /** Procurement-written when the village reaches `live`. */
  deployedAt?: string | null;
  /** True once procurement owns this village's deployment. */
  managed?: boolean;
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

/**
 * An event as it comes back from *another* village's Closer API. Deliberately
 * looser than the local `Event` type: we only rely on the handful of fields we
 * render, and a village may be running an older build of the platform.
 */
export type VillageEvent = {
  _id: string;
  name: string;
  slug?: string;
  photo?: string;
  visual?: string;
  start?: string;
  end?: string;
  location?: string;
  address?: string;
  virtual?: boolean;
};

export type VillageMapItem = {
  _id?: string;
  slug?: string;
  name: string;
  description: string;
  tags: string[];
  country: string;
  website?: string;
  /** Leaflet order — `[lat, lng]`. Ready to hand straight to a map. */
  coords: LatLng;
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
  /** Only villages actually serving on Closer — `onboardingStatus: 'live'`. */
  deployedOnly?: boolean;
  /** Drafts are left out unless asked for; only their own people can read them anyway. */
  includeDrafts?: boolean;
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
  /** Admin-only, and only until the slug freezes. Generated from `name` on create. */
  slug?: string;
  description: string;
  tags?: string[];
  country: string;
  website?: string;
  appUrl?: string;
  apiUrl?: string;
  /**
   * Leaflet order — `[lat, lng]`. Form state is map-shaped; `createVillage` and
   * `updateVillage` convert to GeoJSON at the API boundary.
   */
  coords: LatLng;
  status?: VillageStatus;
  capacity?: VillageCapacity;
  amenities?: string[];
  contact?: VillageContact;
  criteria?: VillageCriteria;
  projectManager?: VillageManagerInfo;
  referredBy?: string;
  ambassadorId?: string;
  applicationId?: string;
  managedBy?: string[];
  verificationBadge?: VillageVerificationBadge;
  onboardingStatus?: VillageOnboardingStatus;
  /** `private` keeps the village a draft: off the map until it is approved. */
  visibility?: 'public' | 'private';
};
