import { useState } from 'react';

import { ACCOMODATION_COST } from '../config';
import { __ } from '../utils/helpers';
import AccomodationEstimate from './AccomodationEstimate';
import AccomodationPriceInfo from './AccomodationPriceInfo';
import TokenBuyWidget from './TokenBuyWidget';
import TokenSaleHeader from './TokenSaleHeader';

const TokenSaleView = () => {
  const [weeksNumber, setWeeksNumber] = useState(4);
  const [selectedAccomodation, selectAccomodation] = useState(
    ACCOMODATION_COST[0].name,
  );

  return (
    <>
      <div className="flex flex-col font-marketing w-full px-4 pb-20 mt-6 md:px-20 md:mt-20 ">
        <div className="flex flex-col md:flex-row mb-4 gap-8">
          <TokenSaleHeader
            title={__('token_sale_page_title')}
            description={__('token_sale_page_description')}
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
            {__('token_sale_page_accomodation_cost_title')}
          </p>
          <div className="max-w-screen-sm w-full mt-4">
            <AccomodationPriceInfo />
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenSaleView;
