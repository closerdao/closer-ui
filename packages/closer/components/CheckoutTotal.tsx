import { DEFAULT_CURRENCY } from '../constants';
import { CloserCurrencies, Price } from '../types';
import { __, getVatInfo, priceFormat } from '../utils/helpers';
import CalculatorIcon from './icons/CalculatorIcon';
import HeadingRow from './ui/HeadingRow';

interface Props {
  total: Price<CloserCurrencies> | undefined;
  useTokens: boolean;
  rentalToken: Price<CloserCurrencies> | undefined;
  vatRate: number;
}

const CheckoutTotal = ({ total, useTokens, rentalToken, vatRate }: Props) => {
  return (
    <div>
      <HeadingRow>
        <span className="mr-2">
          <CalculatorIcon />
        </span>
        <span>{__('bookings_checkout_step_total_title')}</span>
      </HeadingRow>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_total')}</p>
        <p className="font-bold">
          {total ? priceFormat(total.val, total.cur || DEFAULT_CURRENCY) : '?€'}
          {useTokens && ` + ${priceFormat(rentalToken?.val, rentalToken?.cur)}`}
        </p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_checkout_step_total_description')} {getVatInfo(total, vatRate)}
      </p>
    </div>
  );
};

export default CheckoutTotal;
