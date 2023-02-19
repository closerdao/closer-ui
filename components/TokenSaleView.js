import { useEffect, useState } from 'react';

import { __ } from '../utils/helpers';
import TokenSaleHeader from './BookingBackButton';
import Layout from './Layout';

const CEUR_PER_TDF = 230.23;

const ACCOMODATION_COST = [
  {
    name: 'Glamping',
    price: 1,
    iconPath: '/images/token-sale/tent-icon.svg',
  },
  {
    name: 'Van parking',
    price: 0.5,
    iconPath: '/images/token-sale/car-icon.svg',
  },
  {
    name: 'Outdoor Camping',
    price: 0.5,
    iconPath: '/images/token-sale/tent-icon.svg',
  },
  {
    name: 'Private suite',
    description: '*coming 2023*',
    price: 3,
    iconPath: '/images/token-sale/suite-icon.svg',
  },
];

const TokenSaleView = () => {
  const [weeksNumber, setWeeksNumber] = useState(4);
  const [selectedAccomodation, selectAccomodation] = useState(
    ACCOMODATION_COST[0].name,
  );
  const selectedValue = ACCOMODATION_COST.find(
    (accomodation) => accomodation.name === selectedAccomodation,
  )?.price;
  const [tokenToBuy, setTokenToBuy] = useState(weeksNumber * selectedValue);
  const [tokenToSpend, setTokenToSpend] = useState(
    Math.round((tokenToBuy * CEUR_PER_TDF + Number.EPSILON) * 100) / 100,
  );

  const handleTDFChange = (event) => {
    const value = event.target.value;
    setTokenToBuy(value);
    setTokenToSpend(value * CEUR_PER_TDF);
  };

  const handleCEURChange = (event) => {
    const value = event.target.value;
    setTokenToSpend(value);
    setTokenToBuy(value / CEUR_PER_TDF);
  };

  useEffect(() => {
    setTokenToBuy(weeksNumber * selectedValue);
  }, [selectedValue, weeksNumber]);

  useEffect(() => {
    setTokenToSpend(
      Math.round((tokenToBuy * CEUR_PER_TDF + Number.EPSILON) * 100) / 100,
    );
  }, [tokenToBuy]);

  return (
    <Layout>
      <div className="flex flex-col font-marketing w-full px-4 pb-20 mt-6 md:px-20 md:mt-20 ">
        <div className="flex flex-col md:flex-row mb-4 gap-8">
          <TokenSaleHeader
            title={__('token_sale_page_title')}
            description={__('token_sale_page_description')}
          />
        </div>
        <p className="flex flex-wrap self-center mt-8 md:mt-28 items-center gap-4 text-center md:text-left">
          <span className="text-2xl leading-8 w-1/2 md:w-fit">
            {__('token_sale_page_I_want_stay')}
          </span>
          <input
            type="number"
            value={weeksNumber}
            onChange={(e) => setWeeksNumber(e.target.value)}
            min={1}
            max={52}
            step={1}
            className="inline w-16 m-0 mx-2 text-2xl bg-primary-light rounded-full px-4 !text-primary !border-none"
          />
          <span className="text-2xl leading-8 w-full md:w-auto">
            {__('token_sale_page_stay_weeks')}
          </span>
          <select
            value={selectedAccomodation}
            onChange={(e) => selectAccomodation(e.target.value)}
            className="flex-1 h-12 mx-2 mt-4 md:mt-0 py-1 px-4 rounded-full text-2xl bg-primary-light text-primary !border-none"
          >
            {ACCOMODATION_COST.map((accomodation) => (
              <option key={accomodation.name} value={accomodation.name}>
                {accomodation.name}
              </option>
            ))}
          </select>
          <span className="text-2xl leading-8 flex-auto mt-4 md:mt-0">
            {__('token_sale_page_I_should_buy')}
          </span>
        </p>
        <div className="flex flex-col w-full md:w-96 self-center mt-8 md:mt-24">
          <div className="relative">
            <input
              value={tokenToBuy}
              onChange={handleTDFChange}
              className="h-16 text-right px-4 pr-8 rounded-full text-2xl bg-primary-light text-primary !border-none"
            />
            <p className="absolute top-2 left-4 py-2 px-6 rounded-full bg-white text-2xl">
              {__('tdf_token')}
            </p>
          </div>
          <p className="text-stone-500 text-xs w-full text-center p-1">
            1 $TDF = 230.23 CEUR
          </p>
          <div className="relative mb-4">
            <input
              value={tokenToSpend}
              onChange={handleCEURChange}
              className="h-16 text-right px-4 pr-8 rounded-full text-2xl bg-primary-light text-primary !border-none"
            />
            <p className="absolute top-2 left-4 bg-white py-2 px-6 rounded-full text-2xl flex items-center">
              <img
                src="/images/token-sale/ceur-icon.svg"
                alt=""
                className="inline mr-1"
              />
              <span>{__('ceur_token')}</span>
            </p>
          </div>
          <button className="bg-primary text-white uppercase font-bold w-full text-2xl md:text-4xl py-3 px-12 rounded-full whitespace-nowrap">
            Buy now
          </button>
        </div>
        <div className="flex flex-col mt-16 md:mt-32">
          <p className="text-2xl leading-8 text-center md:text-left">
            {__('token_sale_page_accomodation_cost_title')}
          </p>
          <div className="max-w-screen-sm w-full mt-4">
            <div className="p-2 md:p-6 md:shadow-4xl rounded-lg mt-2 w-full">
              <p className="text-right text-base leading-8">
                {__('token_sale_page_price_description')}
              </p>
              <div className="flex flex-col gap-4 mt-4">
                {ACCOMODATION_COST.map((accomodation) => (
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
                        <p className="text-base text-primary">
                          {accomodation.description}
                        </p>
                      </div>
                    </div>
                    <p className="text-primary text-xl md:text-2xl leading-8 whitespace-nowrap">
                      {`${__('tdf_token')} ${String(accomodation.price)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-base text-center md:text-right mt-4 ">
              {__('token_sale_page_food_disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TokenSaleView;
