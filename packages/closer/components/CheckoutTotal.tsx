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
}

const CheckoutTotal = ({ total, useTokens, rentalToken }: Props) => {
  const t = useTranslations();
  return (
    <div>
      <HeadingRow>
        <span className="mr-2">
          <CalculatorIcon />
        </span>
        <span>{t('bookings_checkout_step_total_title')}</span>
      </HeadingRow>
      <div className="flex justify-between items-center mt-3">
        <p> {t('bookings_total')}</p>
        <p className="font-bold">
          {total ? priceFormat(total.val, total.cur || DEFAULT_CURRENCY) : '?€'}
          {useTokens && ` + ${priceFormat(rentalToken?.val, rentalToken?.cur)}`}
        </p>
      </div>
      <p className="text-right text-xs">
        {t('bookings_checkout_step_total_description')} {getVatInfo(total)}
      </p>
    </div>
  );
};

export default CheckoutTotal;
