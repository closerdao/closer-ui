import React, {
  Dispatch,
  FC,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';

import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';
import { getCurrentUnitPrice, getTotalPrice } from '../../utils/bondingCurve';
import { __ } from '../../utils/helpers';
import Select from '../ui/Select/Dropdown';
import { Item } from '../ui/Select/types';

interface Props {
  tokensToBuy: number;
  setTokensToBuy: Dispatch<SetStateAction<number>>;
}

const TokenBuyWidget: FC<Props> = ({ tokensToBuy, setTokensToBuy }) => {
  const { SOURCE_TOKEN } = useConfig() || {};
  const { getCurrentSupply } = useBuyTokens();
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [currentSupply, setCurrentSupply] = useState<number>(0);
  const { isWalletReady } = useContext(WalletState);
  const [accommodationOptions, setAccommodationOptions] = useState<{
    labels: Item[];
    prices: number[];
  }>();
  const [selectedAccommodation, setSelectedAccommodation] = useState({
    name: '',
    price: 0,
  });

  useEffect(() => {
    (async () => {
      const res = await api.get('/listing');
      const labels = res.data.results.map((option: any) => {
        return { label: option.name, value: option.name };
      });

      const prices = res.data.results.map((option: any) => {
        return option.tokenPrice.val;
      });

      setAccommodationOptions({ labels, prices });
      setSelectedAccommodation({
        name: res.data.results[0].name,
        price: res.data.results[0].tokenPrice.val,
      });
    })();
  }, []);

  const [tokensToSpend, setTokensToSpend] = useState(0);
  const [daysToStay, setDaysToStay] = useState(0);

  useEffect(() => {
    if (isWalletReady) {
      (async () => {
        const supply = await getCurrentSupply();
        setCurrentSupply(supply);
      })();
    }

    setDaysToStay(tokensToBuy);
  }, [isWalletReady]);

  useEffect(() => {
    if (currentSupply) {
      const price = getCurrentUnitPrice(currentSupply);
      setTokenPrice(price);
      const totalPrice = getTotalPrice(currentSupply, tokensToBuy);
      setTokensToSpend(totalPrice);
    }
  }, [currentSupply, tokensToBuy]);

  const handleAccommodationSelect = (value: string) => {
    const index = accommodationOptions?.labels.findIndex((option: Item) => {
      return option.label === value;
    });

    const price =
      (index !== undefined &&
        accommodationOptions &&
        accommodationOptions.prices[index]) ||
      1;

    setSelectedAccommodation({ name: value, price });
    setTokensToBuy(Math.ceil(daysToStay * price));
    setTokensToSpend(Math.ceil(Math.ceil(daysToStay * price) * tokenPrice));
  };

  const handleTokensToBuyChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const index = accommodationOptions?.labels.findIndex((option: Item) => {
      return option.label === selectedAccommodation.name;
    });

    const price =
      index !== undefined &&
      accommodationOptions &&
      accommodationOptions.prices[index];

    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    setTokensToBuy(value);
    setTokensToSpend(Number((value * tokenPrice).toFixed(2)));
    if (price) {
      setDaysToStay(Math.floor(value / Number(price)));
    } else {
      setDaysToStay(value);
    }
  };

  const handleTokensToSpendChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    setTokensToBuy(Math.floor(value / tokenPrice));
    setTokensToSpend(Number(value.toFixed(2)));
    setDaysToStay(Math.floor(value / tokenPrice));
  };

  const handleDaysToStayChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const index = accommodationOptions?.labels.findIndex((option: Item) => {
      return option.label === selectedAccommodation.name;
    });

    const price =
      index !== undefined &&
      accommodationOptions &&
      accommodationOptions.prices[index];
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    if (price) {
      setTokensToBuy(Math.ceil(value * Number(price)));
      setTokensToSpend(
        Number((Math.ceil(value * Number(price)) * tokenPrice).toFixed(2)),
      );
    } else {
      setTokensToBuy(Math.ceil(value));
      setTokensToSpend(Number((Math.ceil(value) * tokenPrice).toFixed(2)));
    }
    setDaysToStay(value);
  };

  return (
    <div className="flex flex-col gap-4 my-10">
      <p className="text-stone-500 text-md w-full  p-1">
        1 {__('token_sale_token_symbol')} = {tokenPrice} {SOURCE_TOKEN}
      </p>
      <div className="flex gap-4">
        <label
          htmlFor="tokensToBuy"
          className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_token_symbol')}
        </label>
        <input
          id="tokensToBuy"
          value={tokensToBuy}
          onChange={handleTokensToBuyChange}
          className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
        />
      </div>

      <div className="flex gap-4">
        <label
          htmlFor="tokensToSpend"
          className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_source_token')}
        </label>
        <input
          id="tokensToSpend"
          value={tokensToSpend}
          onChange={handleTokensToSpendChange}
          className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
        />
      </div>

      <div className="flex gap-4 flex-wrap sm:flex-nowrap">
        <label
          htmlFor="accommodationOptions"
          className="font-bold bg-accent-light w-1/2 py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_widget_stay')}
        </label>

        <Select
          id="accommodationOptions"
          value={selectedAccommodation.name}
          options={accommodationOptions?.labels || []}
          className="w-full"
          onChange={handleAccommodationSelect}
          isRequired
          size="large"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <label
          htmlFor="daysToStay"
          className="w-auto font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_widget_for')}
        </label>
        <input
          id="daysToStay"
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
