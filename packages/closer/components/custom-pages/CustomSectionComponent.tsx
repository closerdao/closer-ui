import React from 'react';

import dynamic from 'next/dynamic';

import CustomCTA from './CustomCTA';
import CustomCitizenProgressBar from './CustomCitizenProgressBar';
import CustomCitizenshipStatus from './CustomCitizenshipStatus';
import CustomCohousingApplication from './CustomCohousingApplication';
import CustomCollapsibleFaq from './CustomCollapsibleFaq';
import CustomEventsCalendar from './CustomEventsCalendar';
import CustomFaqs from './CustomFaqs';
import CustomFinancedTokensStart from './CustomFinancedTokensStart';
import CustomFloatingBuyTokens from './CustomFloatingBuyTokens';
import CustomFundraiser from './CustomFundraiser';
import CustomFundraiserMilestones from './CustomFundraiserMilestones';
import CustomFundraiserProgress from './CustomFundraiserProgress';
import CustomFundraiserRewards from './CustomFundraiserRewards';
import CustomHero from './CustomHero';
import CustomListing from './CustomListing';
import CustomListingsPreviews from './CustomListingsPreviews';
import CustomMedia from './CustomMedia';
import CustomPastEvents from './CustomPastEvents';
import CustomPressContact from './CustomPressContact';
import CustomPressHighlights from './CustomPressHighlights';
import CustomPressPodcasts from './CustomPressPodcasts';
import CustomPressPublications from './CustomPressPublications';
import CustomPressStats from './CustomPressStats';
import CustomPriceHistory from './CustomPriceHistory';
import CustomProjectList from './CustomProjectList';
import CustomPromoCard from './CustomPromoCard';
import CustomReviews from './CustomReviews';
import CustomRichText from './CustomRichText';
import CustomStats from './CustomStats';
import CustomStaySearch from './CustomStaySearch';
import CustomSubscriptionPlans from './CustomSubscriptionPlans';
import CustomSupplyGraph from './CustomSupplyGraph';
import CustomTeamDepartments from './CustomTeamDepartments';
import CustomTeamGovernance from './CustomTeamGovernance';
import CustomTeamJoinCta from './CustomTeamJoinCta';
import CustomTeamDirectory from './CustomTeamDirectory';
import CustomTeamMembers from './CustomTeamMembers';
import CustomTeamPartners from './CustomTeamPartners';
import CustomTeamStructure from './CustomTeamStructure';
import CustomTestimonials from './CustomTestimonials';
import CustomTextBlock from './CustomTextBlock';
import CustomTextCard from './CustomTextCard';
import CustomTimeline from './CustomTimeline';
import CustomTokenStats from './CustomTokenStats';
import CustomUpcomingEvents from './CustomUpcomingEvents';
import CustomVideoEmbed from './CustomVideoEmbed';
import CustomVolunteerCta from './CustomVolunteerCta';
import CustomDailyContribution from './CustomDailyContribution';
import CustomDataroom from './CustomDataroom';
import CustomBarChart from './CustomBarChart';
import CustomDataTable from './CustomDataTable';
import CustomDocuments from './CustomDocuments';
import CustomEmailGate from './CustomEmailGate';
import CustomFlowDiagram from './CustomFlowDiagram';
import CustomWebinar from './CustomWebinar';
import { isDynamicBlockType } from '../../constants/dynamicBlockTypes';
import { useEmailGate } from '../../hooks/useEmailGate';
import { getSectionBackgroundClass } from './sectionBackground';
import type { SectionBackground } from '../../types/page';

const CustomPhotoGallery = dynamic(() => import('./CustomPhotoGallery'), {
  ssr: false,
});

const componentRegistry: Record<string, React.ComponentType<any>> = {
  promoCard: CustomPromoCard,
  text: CustomTextCard,
  listing: CustomListing,
  hero: CustomHero,
  gallery: CustomPhotoGallery,
  events: CustomUpcomingEvents,
  upcomingEvents: CustomUpcomingEvents,
  pastEvents: CustomPastEvents,
  eventsCalendar: CustomEventsCalendar,
  faqs: CustomFaqs,
  collapsibleFaq: CustomCollapsibleFaq,
  richText: CustomRichText,
  videoEmbed: CustomVideoEmbed,
  media: CustomMedia,
  textBlock: CustomTextBlock,
  staySearch: CustomStaySearch,
  bookAStay: CustomStaySearch,
  features: CustomListing,
  timeline: CustomTimeline,
  testimonials: CustomTestimonials,
  stats: CustomStats,
  cta: CustomCTA,
  fundraiser: CustomFundraiser,
  fundraiserProgress: CustomFundraiserProgress,
  fundraiserMilestones: CustomFundraiserMilestones,
  fundraiserRewards: CustomFundraiserRewards,
  tokenStats: CustomTokenStats,
  webinar: CustomWebinar,
  floatingBuyTokens: CustomFloatingBuyTokens,
  supplyGraph: CustomSupplyGraph,
  priceHistory: CustomPriceHistory,
  citizenProgressBar: CustomCitizenProgressBar,
  citizenshipStatus: CustomCitizenshipStatus,
  financedTokensStart: CustomFinancedTokensStart,
  cohousingApplication: CustomCohousingApplication,
  listingsPreviews: CustomListingsPreviews,
  reviews: CustomReviews,
  volunteerCta: CustomVolunteerCta,
  projectList: CustomProjectList,
  dailyContribution: CustomDailyContribution,
  subscriptionPlans: CustomSubscriptionPlans,
  teamStructure: CustomTeamStructure,
  teamMembers: CustomTeamMembers,
  teamDirectory: CustomTeamDirectory,
  teamDepartments: CustomTeamDepartments,
  teamPartners: CustomTeamPartners,
  teamGovernance: CustomTeamGovernance,
  teamJoinCta: CustomTeamJoinCta,
  pressStats: CustomPressStats,
  pressPublications: CustomPressPublications,
  pressHighlights: CustomPressHighlights,
  pressPodcasts: CustomPressPodcasts,
  pressContact: CustomPressContact,
  // Deprecated: superseded by the individual blocks the /dataroom page is now
  // built from. Kept so pages that still have a saved `dataroom` block render.
  dataroom: CustomDataroom,
  emailGate: CustomEmailGate,
  dataTable: CustomDataTable,
  documents: CustomDocuments,
  barChart: CustomBarChart,
  flowDiagram: CustomFlowDiagram,
};

const CustomSectionComponent: React.FC<{
  type: string;
  data: any;
  embedded?: boolean;
}> = ({ type, data, embedded }) => {
  const { isReady, isUnlocked } = useEmailGate();
  const Component = componentRegistry[type];
  if (!Component) return null;
  const background = (data?.background as SectionBackground | undefined) ?? undefined;
  const bgClass =
    isDynamicBlockType(type) ? '' : getSectionBackgroundClass(background);
  const settings = data?.settings ?? {};
  const content = data?.content ?? {};
  // Blocks placed after an `emailGate` can opt into staying hidden until the
  // visitor unlocks the page. The editor always shows them.
  if (settings.gatedByEmail === true && !embedded && (!isReady || !isUnlocked)) {
    return null;
  }
  const usesInternalBackground = type === 'hero';
  const block = (
    <Component
      settings={settings}
      content={content}
      embedded={embedded}
      background={background}
    />
  );
  if (bgClass && !usesInternalBackground) {
    return <div className={`w-full ${bgClass}`}>{block}</div>;
  }
  return <div className="w-full">{block}</div>;
};

export default CustomSectionComponent;
