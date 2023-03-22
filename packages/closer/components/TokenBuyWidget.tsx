import { FC, useEffect, useState } from 'react';

import { useConfig } from '../hooks/useConfig';
import { __ } from '../utils/helpers';

const DAYS_IN_A_WEEK = 7;

interface Props {
  weeks: number;
  selectedAccomodation: string;
}

const TokenBuyWidget: FC<Props> = ({ weeks, selectedAccomodation }) => {
  const { ACCOMODATION_COST, SOURCE_TOKEN, TOKEN_PRICE } = useConfig() || {};
  const selectedValue =
    ACCOMODATION_COST.find(
      (accomodation: { name: string }) =>
        accomodation.name === selectedAccomodation,
    )?.price * DAYS_IN_A_WEEK;
  const [tokenToBuy, setTokenToBuy] = useState(weeks * selectedValue);
  const [tokenToSpend, setTokenToSpend] = useState(
    Math.round((tokenToBuy * TOKEN_PRICE + Number.EPSILON) * 100) / 100,
  );

  const handleTokenToBuyChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(event.target.value, 10);
    setTokenToBuy(value);
    setTokenToSpend(value * TOKEN_PRICE);
  };

  const handleTokenToSpendChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(event.target.value, 10);
    setTokenToSpend(value);
    setTokenToBuy(value / TOKEN_PRICE);
  };

  useEffect(() => {
    setTokenToBuy(weeks * selectedValue);
  }, [selectedValue, weeks]);

  useEffect(() => {
    setTokenToSpend(
      Math.round((tokenToBuy * TOKEN_PRICE + Number.EPSILON) * 100) / 100,
    );
  }, [tokenToBuy]);
  return (
    <>
      <div className="relative">
        <input
          value={tokenToBuy}
          onChange={handleTokenToBuyChange}
          className="h-16 text-right px-4 pr-8 rounded-full text-2xl bg-primary-light text-primary !border-none"
        />
        <p className="absolute top-2 left-4 py-2 px-6 rounded-full bg-white text-2xl">
          {__('token_sale_token_symbol')}
        </p>
      </div>
      <p className="text-stone-500 text-xs w-full text-center p-1">
        {__('token_sale_page_token_price', `${TOKEN_PRICE} ${SOURCE_TOKEN}`)}
      </p>
      <div className="relative mb-4">
        <input
          value={tokenToSpend}
          onChange={handleTokenToSpendChange}
          className="h-16 text-right px-4 pr-8 rounded-full text-2xl bg-primary-light text-primary !border-none"
        />
        <p className="absolute top-2 left-4 bg-white py-2 px-6 rounded-full text-2xl flex items-center">
          <img
            src="/images/token-sale/source-token-icon.svg"
            alt=""
            className="inline mr-1"
          />
          <span>{__('token_sale_source_token')}</span>
        </p>
      </div>
      <button className="bg-primary text-white uppercase font-bold w-full text-2xl md:text-4xl py-3 px-12 rounded-full whitespace-nowrap">
        {__('token_sale_buy_button_text')}
      </button>
    </>
  );
};

export default TokenBuyWidget;
