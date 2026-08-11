export type SectionType =
  | 'hero'
  | 'gallery'
  | 'testimonials'
  | 'stats'
  | 'features'
  | 'richText'
  | 'cta'
  | 'media'
  | 'textBlock'
  | 'bookAStay'
  | 'staySearch'
  | 'upcomingEvents'
  | 'pastEvents'
  | 'events'
  | 'eventsCalendar'
  | 'fundraiser'
  | 'tokenStats'
  | 'floatingBuyTokens'
  | 'supplyGraph'
  | 'priceHistory'
  | 'webinar'
  | 'citizenProgressBar'
  | 'financedTokensStart'
  | 'cohousingApplication'
  | 'listingsPreviews'
  | 'reviews'
  | 'volunteerCta'
  | 'dailyContribution'
  | 'subscriptionPlans'
  | 'fundraiserProgress'
  | 'fundraiserMilestones'
  | 'fundraiserRewards'
  | 'teamStructure'
  | 'teamMembers'
  | 'teamDepartments'
  | 'teamPartners'
  | 'teamGovernance'
  | 'teamJoinCta'
  | 'pressStats'
  | 'pressPublications'
  | 'pressHighlights'
  | 'pressPodcasts'
  | 'pressContact'
  | 'dataroom'
  | 'emailGate'
  | 'dataTable'
  | 'documents'
  | 'barChart'
  | 'flowDiagram'
  | 'timeline'
  | 'collapsibleFaq';

export type SectionBackground =
  | 'transparent'
  | 'white'
  | 'neutral-light'
  | 'accent-light'
  | 'gray-50'
  | 'gradient-accent'
  | 'dark';

export interface PageSection {
  _id?: string;
  _localId?: string;
  type: SectionType;
  data: Record<string, unknown> & { background?: SectionBackground };
}

export interface PageDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  ogImage?: string;
  sections: PageSection[];
  aiMeta?: Record<string, unknown>;
  showInMenu?: boolean;
  menuLabel?: string;
  menuSection?: string;
  menuSectionOrder?: number;
  menuOrder?: number;
  isStandard?: boolean;
  isDefault?: boolean;
}

export interface PageMetaOverride {
  title?: string;
  description?: string;
  ogImage?: string;
}
