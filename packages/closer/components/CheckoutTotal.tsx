import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../constants';
import { CloserCurrencies, Price } from '../types';
import { getVatInfo, priceFormat } from '../utils/helpers';
import CalculatorIcon from './icons/CalculatorIcon';
import HeadingRow from './ui/HeadingRow';

interface Props {
  total: Price<CloserCurrencies> | undefined;
  useTokens: boolean;
  rentalToken: Price<CloserCurrencies> | undefined;
  vatRate: number;
  useCredits: boolean;
  priceInCredits: number;
  productName?: string;
  compact?: boolean;
}

const CheckoutTotal = ({
  productName,
  total,
  useTokens,
  rentalToken,
  useCredits,
  priceInCredits,
  vatRate,
  compact,
}: Props) => {
  const t = useTranslations();
  const totalLabel = productName ? `${productName} ` : t('bookings_total');
  const totalValue = (
    <>
      {useTokens && `${priceFormat(rentalToken?.val, rentalToken?.cur)} + `}
      {useCredits &&
        `${priceFormat({ val: priceInCredits, cur: 'credits' })} + `}
      {total ? priceFormat(total.val, total.cur || DEFAULT_CURRENCY) : '?€'}
    </>
  );
  const vatLine = (
    <p className="text-right text-xs">
      {t('bookings_checkout_step_total_description')} {getVatInfo(total, vatRate)}
    </p>
  );
  if (compact) {
    return (
      <div>
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">{totalLabel}</p>
          <p className="font-bold text-sm">{totalValue}</p>
        </div>
        {vatLine}
      </div>
    );
  }
  return (
    <div>
      <HeadingRow>
        <span className="mr-2">
          <CalculatorIcon />
        </span>
        <span>{t('bookings_checkout_step_total_title')}</span>
      </HeadingRow>
      <div className="flex justify-between items-center mt-2">
        <p> {totalLabel} </p>
        <p className="font-bold">{totalValue}</p>
      </div>
      {vatLine}
    </div>
  );
};

export default CheckoutTotal;
