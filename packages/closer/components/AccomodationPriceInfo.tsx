import React from 'react';

import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';

const AccomodationPriceInfo = () => {
  const t = useTranslations();

  const { ACCOMODATION_COST } = useConfig() || {};

  return (
    <>
      <div className="p-2 md:p-6 md:shadow-4xl rounded-lg mt-2 w-full">
        <p className="text-right text-base leading-8">
          {t('token_sale_page_price_description')}
        </p>
        <div className="flex flex-col gap-4 mt-4">
          {ACCOMODATION_COST.map(
            (accomodation: {
              name: string;
              price: number;
              iconPath: string;
              description?: string;
            }) => (
              <div
                className="flex items-center justify-between"
                key={accomodation.name}
              >
                <div className="flex gap-4 items-center">
                  <img src={accomodation.iconPath} alt="" />
                  <div className="flex flex-col">
                    <p className="text-xl md:text-2xl leading-8">
                      {accomodation.name}
                    </p>
                    <p className="text-base text-accent">
                      {accomodation.description}
                    </p>
                  </div>
                </div>
                <p className="text-accent text-xl md:text-2xl leading-8 whitespace-nowrap">
                  {`${t('token_sale_token_symbol')} ${String(
                    accomodation.price,
                  )}`}
                </p>
              </div>
            ),
          )}
        </div>
      </div>
      <p className="text-base text-center md:text-right mt-4 ">
        {t('token_sale_page_food_disclaimer')}
      </p>
    </>
  );
};

export default AccomodationPriceInfo;
