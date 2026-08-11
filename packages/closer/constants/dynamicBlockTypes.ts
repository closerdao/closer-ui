import type { SectionType } from '../types/page';

export const DYNAMIC_BLOCK_TYPES: SectionType[] = [
  'bookAStay',
  'staySearch',
  'upcomingEvents',
  'pastEvents',
  'events',
  'eventsCalendar',
  'fundraiser',
  'fundraiserProgress',
  'fundraiserMilestones',
  'fundraiserRewards',
  'tokenStats',
  'floatingBuyTokens',
  'supplyGraph',
  'priceHistory',
  'webinar',
  'citizenProgressBar',
  'financedTokensStart',
  'cohousingApplication',
  'listingsPreviews',
  'volunteerCta',
  'dailyContribution',
  'subscriptionPlans',
  'teamStructure',
  'teamMembers',
  'teamDepartments',
  'teamPartners',
  'teamGovernance',
  'teamJoinCta',
  'pressStats',
  'pressPublications',
  'pressHighlights',
  'pressPodcasts',
  'pressContact',
  'dataroom',
];

const dynamicBlockTypeSet = new Set<string>(DYNAMIC_BLOCK_TYPES);

export const isDynamicBlockType = (type: string): boolean =>
  dynamicBlockTypeSet.has(type);
