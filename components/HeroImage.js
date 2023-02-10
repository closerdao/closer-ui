import dayjs from 'dayjs';

import { TOKEN_SALE_DATE } from '../config';

const HeroImage = () => {
  const saleDate = dayjs(TOKEN_SALE_DATE, 'DD/MM/YYYY');
  const isBeforeDate = dayjs().isBefore(saleDate);

  if (isBeforeDate) {
    return (
      <div className="basis-1/2 w-[410px] h-[410px] bg-[url('/images/token-sale/token_hero_placeholder.jpg')] bg-cover bg-center" />
    );
  }

  return (
    <div className="basis-1/2 w-[410px] h-[410px] bg-[url('/images/token-sale/tdf-coworking.png')] bg-cover bg-center" />
  );
};

export default HeroImage;
