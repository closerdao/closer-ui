import PropTypes from 'prop-types';

import { __, priceFormat } from '../utils/helpers';
import CalculatorIcon from './icons/CalculatorIcon';

export const CheckoutTotal = ({
  totalCostFiat,
  totalCostToken,
  totalCostUtility,
  selectedCurrency,
}) => {
  const isTokenSelected = selectedCurrency === 'TDF';
  const totalValue = isTokenSelected
    ? totalCostToken.val
    : totalCostFiat.val + totalCostUtility.val;

  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3 flex items-center">
        <CalculatorIcon />
        <span>{__('bookings_checkout_step_total_title')}</span>
      </h2>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_total')}</p>
        <p className="font-bold">
          {priceFormat({
            val: totalValue,
            cur: selectedCurrency,
          })}
        </p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_checkout_step_total_description')}
      </p>
    </div>
  );
};

CheckoutTotal.propTypes = {
  total: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
};