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
  | 'fundraiserPromo'
  | 'tokenStats'
  | 'tokenOnboarding'
  | 'tokenContracts'
  | 'tokenBuy'
  | 'tokenFinance'
  | 'floatingBuyTokens'
  | 'supplyGraph'
  | 'priceHistory'
  | 'webinar'
  | 'citizenProgressBar'
  | 'citizenshipStatus'
  | 'financedTokensStart'
  | 'cohousingApplication'
  | 'listingsPreviews'
  | 'reviews'
  | 'volunteerCta'
  | 'projectList'
  | 'dailyContribution'
  | 'subscriptionPlans'
  | 'fundraiserProgress'
  | 'fundraiserDonate'
  | 'fundraiserMilestones'
  | 'fundraiserRewards'
  | 'teamStructure'
  | 'teamMembers'
  | 'teamDirectory'
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

export interface PageLocalization {
  title?: string;
  description?: string;
  sections?: PageSection[];
  generatedAt?: string;
  model?: string;
}

export interface PageDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  ogImage?: string;
  /** Live (published) sections. In the editor this is the working copy. */
  sections: PageSection[];
  /** Unpublished working copy, server-managed alongside `needsPublishing`. */
  draftSections?: PageSection[];
  /** Editor-only: the live sections kept aside while `sections` is the draft. */
  liveSections?: PageSection[];
  needsPublishing?: boolean;
  publishedAt?: string;
  /** Machine translations of the last published copy, keyed by locale. */
  localizations?: Record<string, PageLocalization>;
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
