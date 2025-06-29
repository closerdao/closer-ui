import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslations } from 'next-intl';

import { MAX_LISTINGS_TO_FETCH, SALES_CONFIG } from '../../constants';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { Listing } from '../../types';
import api from '../../utils/api';
import { Information } from '../ui';
import Select from '../ui/Select/Dropdown';
import { Item } from '../ui/Select/types';

const { MAX_TOKENS_PER_TRANSACTION, MAX_WALLET_BALANCE } = SALES_CONFIG;

interface Props {
  tokensToBuy: number;
  setTokensToBuy: Dispatch<SetStateAction<number>>;
  tokensToSpend: number;
  setTokensToSpend: Dispatch<SetStateAction<number>>;
  setIsCalculationPending?: Dispatch<SetStateAction<boolean>>;
}

const TokenBuyWidget: FC<Props> = ({
  tokensToBuy,
  setTokensToBuy,
  tokensToSpend,
  setTokensToSpend,
  setIsCalculationPending,
}) => {
  const t = useTranslations();
  const { SOURCE_TOKEN } = useConfig() || {};
  const { isPending, getTotalCostWithoutWallet } = useBuyTokens();

  const FUTURE_ACCOMMODATION_TYPES = [
    {
      name: `${t('token_sale_public_sale_shared_suite')} (${t(
        'generic_coming_soon',
      )})`,
      price: 1,
    },
    {
      name: `${t('token_sale_public_sale_private_suite')} (${t(
        'generic_coming_soon',
      )})`,
      price: 2,
    },
    {
      name: `${t('token_sale_public_sale_studio')} (${t(
        'generic_coming_soon',
      )})`,
      price: 3,
    },
    {
      name: `${t('token_sale_public_sale_house')} (${t(
        'generic_coming_soon',
      )})`,
      price: 5,
    },
  ];

  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [accommodationOptions, setAccommodationOptions] = useState<{
    labels: Item[];
    prices: number[];
  }>();
  const [selectedAccommodation, setSelectedAccommodation] = useState({
    name: '',
    price: 0,
  });

  const [nightsPerYear, setNightsPerYear] = useState(0);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced calculation function to prevent race conditions
  const debouncedCalculateTotalCost = (amount: number) => {
    // Clear any existing timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Set calculation as pending
    setIsCalculationPending?.(true);

    // Debounce the calculation
    calculationTimeoutRef.current = setTimeout(async () => {
      try {
        const totalCost = await getTotalCostWithoutWallet(amount.toString());

        // Only update if the request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setTokensToSpend(totalCost);
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Error calculating total cost:', error);
          setTokensToSpend(0);
        }
      } finally {
        // Only clear pending state if the request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setIsCalculationPending?.(false);
        }
      }
    }, 300); // 300ms debounce
  };

  useEffect(() => {
    (async () => {
      const res = await api.get('/listing', {
        params: {
          limit: MAX_LISTINGS_TO_FETCH,
        },
      });
      const labels = res.data.results
        .filter((option: Listing) => {
          return !option?.priceDuration || option?.priceDuration === 'night';
        })
        .map((option: any) => {
          return { label: option.name, value: option.name };
        });

      const labelsFuture = FUTURE_ACCOMMODATION_TYPES.map(
        (accommodatinType: any) => {
          return { label: accommodatinType.name, value: accommodatinType.name };
        },
      );

      const prices = res?.data?.results?.map((option: any) => {
        return option.tokenPrice.val;
      });

      const pricesFuture = FUTURE_ACCOMMODATION_TYPES.map(
        (accommodatinType: any) => {
          return accommodatinType.price;
        },
      );

      labels.push(...labelsFuture);
      prices.push(...pricesFuture);

      // const price = res?.data?.results[0].tokenPrice.val || 1;
      const price = await getTotalCostWithoutWallet('1');

      const nightlyPrice = res?.data?.results[0].tokenPrice.val;

      setNightsPerYear(tokensToBuy / nightlyPrice);
      setAccommodationOptions({ labels, prices });
      setSelectedAccommodation({
        name: res?.data?.results[0].name,
        price: res?.data?.results[0].tokenPrice.val,
      });

      // Calculate initial total cost
      debouncedCalculateTotalCost(tokensToBuy);

      setTokenPrice(price);
    })();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAccommodationSelect = (value: string) => {
    const index = accommodationOptions?.labels.findIndex((option: Item) => {
      return option.label === value;
    });

    const price =
      (index !== undefined &&
        accommodationOptions &&
        accommodationOptions.prices[index]) ||
      1;

    setNightsPerYear(tokensToBuy / price);
    setSelectedAccommodation({ name: value, price });
  };

  const handleTokensToBuyChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newValue = Number(event.target.value);
    const clampedValue =
      newValue > MAX_TOKENS_PER_TRANSACTION
        ? MAX_TOKENS_PER_TRANSACTION
        : newValue;

    setTokensToBuy(clampedValue);

    // Reset tokens to spend immediately to show loading state
    setTokensToSpend(0);

    // Trigger debounced calculation
    debouncedCalculateTotalCost(clampedValue);
  };

  return (
    <div className="flex flex-col gap-4 my-10">
      <p className="text-stone-500 text-md w-full  p-1">
        1 {t('token_sale_token_symbol')} ≈ {tokenPrice} {SOURCE_TOKEN}
      </p>

      <div className="flex gap-4">
        <label
          htmlFor="tokensToBuy"
          className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {t('token_sale_token_symbol')}
        </label>
        <div className="flex-1 relative">
          <input
            id="tokensToBuy"
            value={tokensToBuy}
            onChange={handleTokensToBuyChange}
            className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
          />
          <p className="absolute right-3 top-4"> {t('token_sale_receive')}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-2">
        <label
          htmlFor="tokensToSpend"
          className="font-bold bg-accent-light py-3.5 px-6 rounded-md text-xl"
        >
          {t('token_sale_source_token')}
        </label>
        <div className="flex-1 relative">
          <input
            id="tokensToSpend"
            disabled={true}
            value={
              isPending || (setIsCalculationPending && tokensToSpend === 0)
                ? 'calculating...'
                : tokensToSpend
            }
            className="h-14 px-4 pr-8 rounded-md text-xl bg-neutral text-black !border-none"
          />
          <p className="absolute right-3 top-4"> {t('token_sale_pay')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-left sm:items-center mb-8">
        <p className=" whitespace-normal text-sm">
          This amount will give you right of staying{' '}
          <strong>{nightsPerYear}</strong> nights a year in a{' '}
        </p>

        <div>
          <Select
            id="accommodationOptions"
            value={selectedAccommodation.name}
            options={accommodationOptions?.labels || []}
            className="rounded-full border-black w-[170px] text-sm py-0.5"
            onChange={handleAccommodationSelect}
            isRequired
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Information>{t('token_sale_gas_fees_note')}</Information>
        <Information>{t('token_sale_max_amount_note')}</Information>
        <Information>{t('token_sale_price_disclaimer')}</Information>
        <Information>
          {t('token_sale_max_wallet_balance')}
          {Math.max(MAX_WALLET_BALANCE, 0)}
        </Information>
      </div>
    </div>
  );
};

export default TokenBuyWidget;
