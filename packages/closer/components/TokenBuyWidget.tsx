import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

import Select from '../components/ui/Select/Dropdown';

import { useBuyTokens } from '../hooks/useBuyTokens';
import { useConfig } from '../hooks/useConfig';
import { __ } from '../utils/helpers';

interface Props {
  tokensToBuy: number;
  setTokensToBuy: Dispatch<SetStateAction<number>>;
}

const TokenBuyWidget: FC<Props> = ({ tokensToBuy, setTokensToBuy }) => {
  const { ACCOMODATION_COST, SOURCE_TOKEN } = useConfig() || {};
  const { getTokenPrice } = useBuyTokens();
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const accommodationOptions = ACCOMODATION_COST.map((option: any) => {
    return { label: option.name, value: option.name };
  });
  const [selectedAccommodation, setSelectedAccommodation] = useState(
    ACCOMODATION_COST[0].name,
  );
  const [tokensToSpend, setTokensToSpend] = useState(0);
  const [daysToStay, setDaysToStay] = useState(0);

  useEffect(() => {
    (async () => {
      const getPrice = await getTokenPrice();
      setTokenPrice(getPrice.price);
    })();

    setDaysToStay(tokensToBuy);
  }, []);

  useEffect(() => {
    if (tokenPrice) {
      setTokensToSpend(Math.ceil(tokensToBuy * tokenPrice));
    }
  }, [tokenPrice]);

  const handleAccommodationSelect = (value: string) => {
    const price = ACCOMODATION_COST.find(
      (accommodation: { name: string }) => accommodation.name === value,
    )?.price;
    setSelectedAccommodation(value);
    setTokensToBuy(Math.ceil(daysToStay * price));
    setTokensToSpend(Math.ceil(daysToStay * price * tokenPrice));
  };

  const handleTokensToBuyChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const price = ACCOMODATION_COST.find(
      (accommodation: { name: string }) =>
        accommodation.name === selectedAccommodation,
    )?.price;

    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    setTokensToBuy(value);
    setTokensToSpend(Math.ceil(value * tokenPrice));
    setDaysToStay(Math.floor(value / price));
  };

  const handleTokensToSpendChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    setTokensToBuy(Math.ceil(value / tokenPrice));
    setTokensToSpend(Math.ceil(value));
    setDaysToStay(Math.floor(value / tokenPrice));
  };

  const handleDaysToStayChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const price = ACCOMODATION_COST.find(
      (accommodation: { name: string }) =>
        accommodation.name === selectedAccommodation,
    )?.price;
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);
    setTokensToBuy(Math.ceil(value * price));
    setTokensToSpend(Math.ceil(value * price * tokenPrice));
    setDaysToStay(value);
  };

  return (
    <div className="flex flex-col gap-4 my-10">
      <p className="text-stone-500 text-md w-full  p-1">
        1 {__('token_sale_token_symbol')} = {tokenPrice} {SOURCE_TOKEN}
      </p>
      <div className="flex gap-4">
        <p className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_token_symbol')}
        </p>
        <input
          value={tokensToBuy}
          onChange={handleTokensToBuyChange}
          className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
        />
      </div>

      <div className="flex gap-4">
        <p className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_source_token')}
        </p>
        <input
          value={tokensToSpend}
          onChange={handleTokensToSpendChange}
          className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
        />
      </div>

      <div className="flex gap-4 flex-wrap sm:flex-nowrap ">
        <p className="font-bold bg-accent-light w-1/2 py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_widget_stay')}
        </p>

        <Select
          value={selectedAccommodation}
          options={accommodationOptions}
          className="w-1/2"
          onChange={handleAccommodationSelect}
          isRequired
          size="large"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <p className="w-auto font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_widget_for')}
        </p>
        <input
          value={daysToStay}
          onChange={handleDaysToStayChange}
          className="w-auto h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black"
        />
        <p className="font-bold bg-accent-light min-w-[228px]  py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_widget_days')}
        </p>
      </div>
    </div>
  );
};

export default TokenBuyWidget;
