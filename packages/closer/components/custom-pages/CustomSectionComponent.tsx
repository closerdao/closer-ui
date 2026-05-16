import React from 'react';

import dynamic from 'next/dynamic';

import CustomCTA from './CustomCTA';
import CustomFaqs from './CustomFaqs';
import CustomFundraiser from './CustomFundraiser';
import CustomHero from './CustomHero';
import CustomListing from './CustomListing';
import CustomPromoCard from './CustomPromoCard';
import CustomRichText from './CustomRichText';
import CustomStats from './CustomStats';
import CustomTestimonials from './CustomTestimonials';
import CustomTextCard from './CustomTextCard';
import CustomTokenStats from './CustomTokenStats';
import CustomVideoEmbed from './CustomVideoEmbed';
import CustomWebinar from './CustomWebinar';
import UpcomingEventsIntro from '../UpcomingEventsIntro';
import { getSectionBackgroundClass } from './sectionBackground';

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
  features: CustomListing,
  testimonials: CustomTestimonials,
  stats: CustomStats,
  cta: CustomCTA,
  fundraiser: CustomFundraiser,
  tokenStats: CustomTokenStats,
  webinar: CustomWebinar,
};

const CustomSectionComponent: React.FC<{ type: string; data: any }> = ({
  type,
  data,
}) => {
  const Component = componentRegistry[type];
  if (!Component) return null;
  const background = data?.background as string | undefined;
  const bgClass = getSectionBackgroundClass(background);
  if (bgClass) {
    return (
      <div className={bgClass}>
        <Component {...data} />
      </div>
    );
  }
  return <Component {...data} />;
};

export default CustomSectionComponent;
