import { getReserveTokenDisplay } from './config.utils';

export interface MemberMenuFeatureFlags {
  ready: boolean;
  appName: string | undefined;
  reserveToken: string;
  isBookingEnabled: boolean;
  areSubscriptionsEnabled: boolean;
  isVolunteeringEnabled: boolean;
  isEventsEnabled: boolean;
  isCommunityEnabled: boolean;
  isGovernanceEnabled: boolean;
  isLearningHubEnabled: boolean;
  isBlogEnabled: boolean;
  isCitizenshipEnabled: boolean;
  isRolesEnabled: boolean;
  isFaqEnabled: boolean;
  isAffiliateEnabled: boolean;
}

const inactiveFlags = (): Omit<
  MemberMenuFeatureFlags,
  'ready' | 'appName' | 'reserveToken'
> => ({
  isBookingEnabled: false,
  areSubscriptionsEnabled: false,
  isVolunteeringEnabled: false,
  isEventsEnabled: false,
  isCommunityEnabled: false,
  isGovernanceEnabled: false,
  isLearningHubEnabled: false,
  isBlogEnabled: false,
  isCitizenshipEnabled: false,
  isRolesEnabled: false,
  isFaqEnabled: false,
  isAffiliateEnabled: false,
});

export function deriveMemberMenuFeatureFlags(
  config: Record<string, any> | null | undefined,
): MemberMenuFeatureFlags {
  const base = inactiveFlags();
  if (!config?._configLoaded) {
    return {
      ready: false,
      appName: config?.APP_NAME,
      reserveToken: getReserveTokenDisplay(config ?? {}),
      ...base,
    };
  }

  const bookingConfig = config.booking;
  const subscriptionsConfig = config.subscriptions;
  const volunteerConfig = config.volunteering;
  const eventsConfig = config.events;
  const communityConfig = config.community;

  const areSubscriptionsEnabled =
    Boolean(subscriptionsConfig?.enabled) &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
  const isBookingEnabled =
    Boolean(bookingConfig?.enabled) &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const isVolunteeringEnabled =
    volunteerConfig?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true';
  const isEventsEnabled = eventsConfig?.enabled !== false;
  const isCommunityEnabled = communityConfig?.enabled === true;
  const isGovernanceEnabled = config.governance?.enabled === true;
  const isLearningHubEnabled =
    config.learningHub?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true';
  const isBlogEnabled =
    config.blog?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true';
  const isCitizenshipEnabled =
    config.citizenship?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';
  const isRolesEnabled =
    config.roles?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_ROLES === 'true';
  const isFaqEnabled = Boolean(config?.FAQS_GOOGLE_SHEET_ID);
  const isAffiliateEnabled =
    config.affiliate?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_AFFILIATE === 'true';

  return {
    ready: true,
    appName: config.APP_NAME,
    reserveToken: getReserveTokenDisplay(config),
    isBookingEnabled,
    areSubscriptionsEnabled,
    isVolunteeringEnabled,
    isEventsEnabled,
    isCommunityEnabled,
    isGovernanceEnabled,
    isLearningHubEnabled,
    isBlogEnabled,
    isCitizenshipEnabled,
    isRolesEnabled,
    isFaqEnabled,
    isAffiliateEnabled,
  };
}
