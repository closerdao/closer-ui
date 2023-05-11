import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';

import { useConfig } from '../hooks/useConfig';
import { __ } from '../utils/helpers';

// const DAYS_IN_A_WEEK = 7;

interface Props {
  // weeks: number;
  // selectedAccomodation: string;
  tokensToBuy: number;
  setTokensToBuy: Dispatch<SetStateAction<number>>;
}

const TokenBuyWidget: FC<Props> = ({ tokensToBuy, setTokensToBuy }) => {
  const { ACCOMODATION_COST, SOURCE_TOKEN, TOKEN_PRICE } = useConfig() || {};

  // const [baseTokenAmount, setBaseTokenAmount] = useState(0);
  const [tokensToSpend, setTokensToSpend] = useState(0);

  useEffect(() => {
    setTokensToSpend(tokensToBuy * TOKEN_PRICE);
  }, [tokensToBuy]);

  // const selectedValue =
  //   ACCOMODATION_COST.find(
  //     (accomodation: { name: string }) =>
  //       accomodation.name === selectedAccomodation,
  //   )?.price * DAYS_IN_A_WEEK;
  //  const [tokenToBuy, setTokenToBuy] = useState(weeks * selectedValue);
  // const [tokenToSpend, setTokenToSpend] = useState(
  //   Math.round((tokenToBuy * TOKEN_PRICE + Number.EPSILON) * 100) / 100,
  // );

  const handleTokensToBuyChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    setTokensToBuy(value);
    setTokensToSpend(value * TOKEN_PRICE);
  };

  const handleTokensToSpendChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    setTokensToBuy(value / TOKEN_PRICE);
    setTokensToSpend(value);
  };

  // useEffect(() => {
  //   setTokenToBuy(weeks * selectedValue);
  // }, [selectedValue, weeks]);

  // useEffect(() => {
  //   setTokenToSpend(
  //     Math.round((tokenToBuy * TOKEN_PRICE + Number.EPSILON) * 100) / 100,
  //   );
  // }, [tokenToBuy]);

  return (
    <div className="flex flex-col gap-4 my-10">
      <p className="text-stone-500 text-md w-full  p-1">
        1 {__('token_sale_token_symbol')} = {TOKEN_PRICE} {SOURCE_TOKEN}
      </p>
      <div className="flex gap-4">
        <p className="font-bold bg-accent-light left-4 py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_token_symbol')}
        </p>
        <input
          value={tokensToBuy}
          onChange={handleTokensToBuyChange}
          className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
        />
      </div>

      <div className="flex gap-4">
        <p className="font-bold bg-accent-light left-4 py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_source_token')}
        </p>
        <input
          value={tokensToSpend}
          onChange={handleTokensToSpendChange}
          className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
        />
      </div>
    </div>
  );
};

export default TokenBuyWidget;
