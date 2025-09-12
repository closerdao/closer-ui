import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useTranslations } from 'next-intl';

import { SALES_CONFIG } from '../../constants';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { getTotalPrice } from '../../utils/bondingCurve';
import { api } from '../../utils/api';

const { MAX_TOKENS_PER_TRANSACTION, MAX_WALLET_BALANCE } = SALES_CONFIG;

interface Props {
  tokensToBuy: number;
  setTokensToBuy: Dispatch<SetStateAction<number>>;
}

const TokenCounterSimple = ({ tokensToBuy, setTokensToBuy }: Props) => {
  const t = useTranslations();
  const { getCurrentSupply, getUserTdfBalance } = useBuyTokens();
  const [currentSupply, setCurrentSupply] = useState<number>(0);
  const [userTdfBalance, setUserTdfBalance] = useState<number>(0);
  const { isWalletReady } = useContext(WalletState);

  const [tokensToSpend, setTokensToSpend] = useState(0);

  useEffect(() => {
    if (isWalletReady) {
      (async () => {
        const supply = await getCurrentSupply();
        const tdfBalance = await getUserTdfBalance();
        setCurrentSupply(supply);
        setUserTdfBalance(tdfBalance);
      })();
    }
  }, [isWalletReady]);

  useEffect(() => {
    if (currentSupply) {
      const totalPrice = getTotalPrice(currentSupply, tokensToBuy);
      setTokensToSpend(totalPrice);
    }
  }, [currentSupply]);

  const calculatePossibleAmount = (desiredAmount: number) => {
    let amount = desiredAmount;
    if (amount > MAX_TOKENS_PER_TRANSACTION) {
      amount = MAX_TOKENS_PER_TRANSACTION;
    }
    if (userTdfBalance + amount > MAX_WALLET_BALANCE) {
      amount = MAX_WALLET_BALANCE - userTdfBalance;
    }
    return amount;
  };

  const handleTokensToSpendChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    const possibleAmount = calculatePossibleAmount(value);
    const priceForTotalAmount = getTotalPrice(currentSupply, possibleAmount);

    setTokensToBuy(possibleAmount);
    setTokensToSpend(priceForTotalAmount);

    // Track calculator usage
    (async () => {
      try {
        await api.post('/metric', {
          event: 'use-calculator',
          value: 'token-sale',
          point: 0,
          category: 'engagement',
        });
      } catch (error) {
        console.error('Error logging calculator usage:', error);
      }
    })();
  };

  const handleTokensToBuyChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value === '' ? 0 : parseInt(event.target.value, 10);

    const possibleAmount = calculatePossibleAmount(value);
    const priceForTotalAmount = getTotalPrice(currentSupply, possibleAmount);

    setTokensToBuy(possibleAmount);
    setTokensToSpend(priceForTotalAmount);

    // Track calculator usage
    (async () => {
      try {
        await api.post('/metric', {
          event: 'use-calculator',
          value: 'token-sale',
          point: 0,
          category: 'engagement',
        });
      } catch (error) {
        console.error('Error logging calculator usage:', error);
      }
    })();
  };

  return (
    <div className="w-[240px] flex flex-col gap-3 my-3">
      <div className="relative">
        <div className="absolute  px-1 py-1 h-10 flex items-center">
          <div className="text-black bg-white rounded-full h-8 px-4 flex items-center">
            {t('token_sale_public_sale_token_symbol')}
          </div>
        </div>

        <input
          max={100}
          min={1}
          type="number"
          id="tokensToBuy"
          value={tokensToBuy}
          onChange={handleTokensToBuyChange}
          className="h-10 px-4 pr-8 rounded-full text-xl bg-accent-light font-bold !text-accent !border-none text-right"
        />
      </div>

      <div className="relative">
        <div className="absolute  px-1 py-1 h-10 flex items-center">
          <div className="text-black bg-white rounded-full h-8 px-4 flex items-center">
            {t('token_sale_source_token')}
          </div>
        </div>
        <input
          min={1}
          type="number"
          id="tokensToSpend"
          value={tokensToSpend}
          onChange={handleTokensToSpendChange}
          className="h-10 px-4 pr-8 rounded-full text-xl bg-accent-light font-bold !text-accent !border-none text-right"
        />
      </div>
    </div>
  );
};

export default TokenCounterSimple;
