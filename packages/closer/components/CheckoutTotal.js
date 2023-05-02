import PropTypes from 'prop-types';

import { DEFAULT_CURRENCY } from '../constants';
import { __, getVatInfo, priceFormat } from '../utils/helpers';
import CalculatorIcon from './icons/CalculatorIcon';
import HeadingRow from './ui/HeadingRow';

const CheckoutTotal = ({ total }) => {
  return (
    <div>
      <HeadingRow>
        <span className="mr-2"><CalculatorIcon /></span>
        <span>{__('bookings_checkout_step_total_title')}</span>
      </HeadingRow>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_total')}</p>
        <p className="font-bold">
          {total ? priceFormat(total.val, total.cur || DEFAULT_CURRENCY) : '?€'}
        </p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_checkout_step_total_description')} {getVatInfo(total)}
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
