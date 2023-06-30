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
import { Information } from '../ui';
import Select from '../ui/Select/Dropdown';
import { Item } from '../ui/Select/types';

const MAX_TOKENS_PER_TRANSACTION = 100;

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
  const [tokensToSpend, setTokensToSpend] = useState(0);
  const [daysToStay, setDaysToStay] = useState(0);

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
  }, [currentSupply]);

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
    setTokensToBuy(
      Math.ceil(daysToStay * price) <= MAX_TOKENS_PER_TRANSACTION
        ? Math.ceil(daysToStay * price)
        : MAX_TOKENS_PER_TRANSACTION,
    );
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

    const tokens =
      value <= MAX_TOKENS_PER_TRANSACTION ? value : MAX_TOKENS_PER_TRANSACTION;

    console.log('tokens=', tokens);
    console.log('Number((tokens * tokenPrice))=', Number(tokens * tokenPrice));
    setTokensToBuy(tokens);
    setTokensToSpend(Number(tokens * tokenPrice));
    if (price) {
      setDaysToStay(Math.floor(tokens / Number(price)));
    }
  };

  const handleTokensToSpendChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);
    const tokens =
      Math.floor(value / tokenPrice) <= MAX_TOKENS_PER_TRANSACTION
        ? Math.floor(value / tokenPrice)
        : MAX_TOKENS_PER_TRANSACTION;
    setTokensToBuy(tokens);

    const toSpend =
      Number(value.toFixed(2)) / tokenPrice <= MAX_TOKENS_PER_TRANSACTION
        ? Number(value.toFixed(2))
        : MAX_TOKENS_PER_TRANSACTION * tokenPrice;
    setTokensToSpend(toSpend);

    setDaysToStay(
      Math.floor(toSpend / tokenPrice / selectedAccommodation.price),
    );
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
      const tokens =
        Math.ceil(value * Number(price)) <= MAX_TOKENS_PER_TRANSACTION
          ? Math.ceil(value * Number(price))
          : MAX_TOKENS_PER_TRANSACTION;
      setTokensToBuy(tokens);
      setTokensToSpend(Number((tokens * tokenPrice).toFixed(2)));
      setDaysToStay(tokens / price);
    }
  };

  return (
    <div className="flex flex-col gap-4 my-10">
      <p className="text-stone-500 text-md w-full  p-1">
        1 {__('token_sale_token_symbol')} ≈ {tokenPrice} {SOURCE_TOKEN}
      </p>

      <div className="flex gap-4 flex-wrap sm:flex-nowrap">
        <label
          htmlFor="accommodationOptions"
          className="font-bold bg-accent-light  py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_widget_stay')}
        </label>

        <div className="flex-1 min-w-[220px]">
          <Select
            id="accommodationOptions"
            value={selectedAccommodation.name}
            options={accommodationOptions?.labels || []}
            className="flex-1"
            onChange={handleAccommodationSelect}
            isRequired
            size="large"
          />
        </div>
      </div>

      <div className="flex gap-4 flex-wrap items-stretch">
        <label
          htmlFor="daysToStay"
          className="  font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_widget_for')}
        </label>
        <div className="flex-1">
          <input
            id="daysToStay"
            value={daysToStay}
            onChange={handleDaysToStayChange}
            className="w-full h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black"
          />
        </div>
        <p className="  font-bold bg-accent-light   py-3.5 px-6 rounded-md text-xl">
          {__('token_sale_widget_days')}
        </p>
      </div>

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t-2 border-neutral"></div>
        <span className="flex-shrink mx-4 uppercase">
          {__('token_sale_i_should_buy')}
        </span>
        <div className="flex-grow border-t-2 border-neutral"></div>
      </div>

      <div className="flex gap-4">
        <label
          htmlFor="tokensToBuy"
          className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_token_symbol')}
        </label>
        <div className="flex-1 relative">
          <input
            max={10}
            id="tokensToBuy"
            value={tokensToBuy}
            onChange={handleTokensToBuyChange}
            className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
          />
          <p className="absolute right-3 top-4"> {__('token_sale_receive')}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-10">
        <label
          htmlFor="tokensToSpend"
          className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {__('token_sale_source_token')}
        </label>
        <div className="flex-1 relative">
          <input
            id="tokensToSpend"
            value={tokensToSpend}
            onChange={handleTokensToSpendChange}
            className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
          />
          <p className="absolute right-3 top-4"> {__('token_sale_pay')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Information>{__('token_sale_gas_fees_note')}</Information>
        <Information>{__('token_sale_max_amount_note')}</Information>
      </div>
    </div>
  );
};

export default TokenBuyWidget;
