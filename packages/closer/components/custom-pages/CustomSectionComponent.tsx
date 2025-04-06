import React from 'react';

import CustomHero from './CustomHero';
import CustomListing from './CustomListing';
import CustomPhotoGallery from './CustomPhotoGallery';
import CustomPromoCard from './CustomPromoCard';
import CustomRichText from './CustomRichText';
import CustomTextCard from './CustomTextCard';
import UpcomingEventsIntro from '../UpcomingEventsIntro';
import CustomFaqs from './CustomFaqs';

const componentRegistry: Record<string, React.FC<any>> = {
  promoCard: CustomPromoCard,
  text: CustomTextCard,
  listing: CustomListing,
  hero: CustomHero,
  gallery: CustomPhotoGallery,
  events: UpcomingEventsIntro,
  faqs: CustomFaqs,
  richText: CustomRichText,
};

const CustomSectionComponent: React.FC<{ type: string; data: any }> = ({
  type,
  data,
}) => {
  const Component = componentRegistry[type];
  if (!Component) return null;
  return <Component {...data} />;
};

export default CustomSectionComponent;
