import PropTypes from 'prop-types';

import { DEFAULT_CURRENCY } from '../constants';
import { __, priceFormat } from '../utils/helpers';
import CalculatorIcon from './icons/CalculatorIcon';

const CheckoutTotal = ({ total }) => {
  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3 flex items-center">
        <CalculatorIcon />
        <span>{__('bookings_checkout_step_total_title')}</span>
      </h2>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_total')}</p>
        <p className="font-bold">
          {priceFormat(total.val, total.cur || DEFAULT_CURRENCY)}
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

export default CheckoutTotal;
