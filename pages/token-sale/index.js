import { useEffect, useState } from 'react';

import Layout from '../../components/Layout';

import dayjs from 'dayjs';

import { TOKEN_SALE_DATE } from '../../config';
import { __ } from '../../utils/helpers';

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

const TokenSalePage = () => {
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
      <div className="flex flex-col w-full px-20 pb-32 mt-20">
        <div className="flex mb-4 gap-8">
          <div className="basis-1/2">
            <h1 className="text-8xl uppercase font-black">
              {__('token_sale_page_title')}
            </h1>
            <p className="mt-10 text-2xl leading-8 font-bold max-w-sm">
              {__('token_sale_page_description')}
            </p>
          </div>
          <div className="basis-1/2 w-[410px] h-[410px] bg-[url('/images/token_hero_placeholder.jpg')] bg-cover bg-center"></div>
        </div>
        <p className="flex self-center mt-28 items-center">
          <span className="text-2xl leading-8">
            {__('token_sale_page_I_want_stay')}
          </span>
          <input
            type="number"
            value={weeksNumber}
            onChange={(e) => setWeeksNumber(e.target.value)}
            min={1}
            max={52}
            step={1}
            className="inline !w-fit !py-0 m-0 mx-2 text-2xl"
          />
          <span className="text-2xl leading-8">
            {__('token_sale_page_stay_weeks')}
          </span>
          <select
            value={selectedAccomodation}
            onChange={(e) => selectAccomodation(e.target.value)}
            className="mx-2 p-0 pl-2 pr-7"
          >
            {ACCOMODATION_COST.map((accomodation) => (
              <option key={accomodation.name} value={accomodation.name}>
                {accomodation.name}
              </option>
            ))}
          </select>
          <span className="text-2xl leading-8">
            {__('token_sale_page_I_should_buy')}
          </span>
        </p>
        <div className="flex flex-col w-96 self-center mt-24">
          <div className="relative">
            <input
              value={tokenToBuy}
              onChange={handleTDFChange}
              className="h-16 text-right rounded-full px-4"
            />
            <p className="absolute top-2 left-2 bg-gray-100 py-3 px-6 rounded-full">
              $TDF
            </p>
          </div>
          <p className="text-stone-500 text-xs w-full text-center p-1">
            1 $TDF = 230.23 CEUR
          </p>
          <div className="relative">
            <input
              value={tokenToSpend}
              onChange={handleCEURChange}
              className="h-16 text-right rounded-full px-4"
            />
            <p className="absolute top-2 left-2 bg-gray-100 py-3 px-6 rounded-full">
              CEUR
            </p>
          </div>
          <button className="btn uppercase mt-6">Buy now</button>
        </div>
        <div className="flex flex-col mt-32">
          <p className="text-2xl leading-8">
            {__('token_sale_page_accomodation_cost_title')}
          </p>
          <div className="max-w-screen-sm w-full">
            <div className="p-6 shadow-4xl rounded-lg mt-2 w-full">
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
                        <p className="text-2xl leading-8">
                          {accomodation.name}
                        </p>
                        <p className="text-base text-primary">
                          {accomodation.description}
                        </p>
                      </div>
                    </div>
                    <p className="text-primary text-2xl leading-8">
                      $TDF {accomodation.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-base text-right mt-4">
              {__('token_sale_page_food_disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// return 404 if token sale date is not reached
export const getServerSideProps = async () => {
  const tokenSaleDate = dayjs(TOKEN_SALE_DATE).format('DD/MM/YYYY');
  const isBeforeDate = dayjs().isBefore(tokenSaleDate);

  if (isBeforeDate) {
    console.log('return 404');
    return {
      notFound: true,
    };
  }
  return {
    props: {},
  };
};

export default TokenSalePage;
