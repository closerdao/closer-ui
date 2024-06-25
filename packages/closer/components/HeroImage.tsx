import React from 'react';
import Image from 'next/image';

import dayjs from 'dayjs';

const HeroImage = () => {
  const TOKEN_SALE_DATE = process.env.NEXT_PUBLIC_TOKEN_SALE_DATE;

  if (!TOKEN_SALE_DATE) {
    console.error('HeroImage: No token sale date');
    return null;
  }

  const saleDate = dayjs(TOKEN_SALE_DATE, 'DD/MM/YYYY');
  const isBeforeDate = dayjs().isBefore(saleDate);
  const imagePath = isBeforeDate
    ? '/images/token-sale/token_hero_placeholder.jpg'
    : '/images/token-sale/tdf-coworking.png';
  return (
    <div className="relative w-full h-96 md:basis-1/2 md:w-96">
      <Image
        src={imagePath}
        alt="$TDF token sale"
        fill={true}
        className="bg-cover bg-center"
      />
    </div>
  );
};

export default HeroImage;
