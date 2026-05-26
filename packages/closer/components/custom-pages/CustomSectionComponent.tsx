import React from 'react';

import dynamic from 'next/dynamic';

import CustomCTA from './CustomCTA';
import CustomFaqs from './CustomFaqs';
import CustomFundraiser from './CustomFundraiser';
import CustomHero from './CustomHero';
import CustomListing from './CustomListing';
import CustomMedia from './CustomMedia';
import CustomPromoCard from './CustomPromoCard';
import CustomRichText from './CustomRichText';
import CustomStats from './CustomStats';
import CustomStaySearch from './CustomStaySearch';
import CustomTestimonials from './CustomTestimonials';
import CustomTextBlock from './CustomTextBlock';
import CustomTextCard from './CustomTextCard';
import CustomTokenStats from './CustomTokenStats';
import CustomVideoEmbed from './CustomVideoEmbed';
import CustomWebinar from './CustomWebinar';
import UpcomingEventsIntro from '../UpcomingEventsIntro';
import { isDynamicBlockType } from '../../constants/dynamicBlockTypes';
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
  events: UpcomingEventsIntro,
  faqs: CustomFaqs,
  richText: CustomRichText,
  videoEmbed: CustomVideoEmbed,
  media: CustomMedia,
  textBlock: CustomTextBlock,
  staySearch: CustomStaySearch,
  features: CustomListing,
  testimonials: CustomTestimonials,
  stats: CustomStats,
  cta: CustomCTA,
  fundraiser: CustomFundraiser,
  tokenStats: CustomTokenStats,
  webinar: CustomWebinar,
};

const CustomSectionComponent: React.FC<{
  type: string;
  data: any;
  embedded?: boolean;
}> = ({ type, data, embedded }) => {
  const Component = componentRegistry[type];
  if (!Component) return null;
  const background = (data?.background as SectionBackground | undefined) ?? undefined;
  const bgClass =
    isDynamicBlockType(type) ? '' : getSectionBackgroundClass(background);
  const settings = data?.settings ?? {};
  const content = data?.content ?? {};
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
