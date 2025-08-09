import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';
import AccomodationEstimate from './AccomodationEstimate';
import AccomodationPriceInfo from './AccomodationPriceInfo';
import TokenBuyWidget from './TokenBuyWidget';
import TokenSaleHeader from './TokenSaleHeader';

const TokenSaleView = () => {
  const t = useTranslations();

  const { ACCOMODATION_COST } = useConfig();
  const [weeksNumber, setWeeksNumber] = useState(4);
  const [selectedAccomodation, selectAccomodation] = useState(
    ACCOMODATION_COST[0].name,
  );

  return (
    <>
      <div className="flex flex-col font-marketing w-full px-4 pb-20 mt-6 md:px-20 md:mt-20 ">
        <div className="flex flex-col md:flex-row mb-4 gap-8">
          <TokenSaleHeader
            title={t('token_sale_page_title')}
            description={t('token_sale_page_description')}
          />
        </div>
        <AccomodationEstimate
          weeksNumber={weeksNumber}
          setWeeksNumber={setWeeksNumber}
          selectedAccomodation={selectedAccomodation}
          selectAccomodation={selectAccomodation}
        />

        <div className="flex flex-col w-full md:w-96 self-center mt-8 md:mt-24">
          <TokenBuyWidget
            weeks={weeksNumber}
            selectedAccomodation={selectedAccomodation}
          />
        </div>
        <div className="flex flex-col mt-16 md:mt-32">
          <p className="text-2xl leading-8 text-center md:text-left">
            {t('token_sale_page_accomodation_cost_title')}
          </p>
          <div className="max-w-screen-sm w-full mt-4">
            <AccomodationPriceInfo />
          </div>
          <div className="text-center mt-8">
            <p className="text-lg mb-4">
              See our complete journey and future plans in our{' '}
              <a href="/roadmap" className="text-accent underline hover:text-accent-dark">
                detailed roadmap
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenSaleView;
