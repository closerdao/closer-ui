import React from 'react';

import CustomHero from './CustomHero';
import CustomListing from './CustomListing';
import CustomPhotoGallery from './CustomPhotoGallery';
import CustomPromoCard from './CustomPromoCard';

const componentRegistry: Record<string, React.FC<any>> = {
  promoCard: CustomPromoCard,
  listing: CustomListing,
  hero: CustomHero,
  gallery: CustomPhotoGallery,
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
