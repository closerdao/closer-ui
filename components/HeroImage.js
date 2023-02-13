import Image from 'next/image';

import dayjs from 'dayjs';

import { TOKEN_SALE_DATE } from '../config';

const HeroImage = () => {
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
        layout="fill"
        objectFit="cover"
        objectPosition="center"
      />
    </div>
  );
};

export default HeroImage;
