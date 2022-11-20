import PropTypes from 'prop-types';

import { __, priceFormat } from '../utils/helpers';

export const CheckoutUtility = ({ totalCostUtility }) => {
  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3">
        <span className="mr-1">🛠</span>
        <span>{__('bookings_checkout_step_utility_title')}</span>
      </h2>
      <div className="flex justify-between items-center my-3">
        <p> {__('bookings_checkout_step_utility_daily')}</p>
        <p className="font-bold">{priceFormat(totalCostUtility)}</p>
      </div>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_checkout_step_utility_total')}</p>
        <p className="font-bold">{priceFormat(totalCostUtility)}</p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_checkout_step_utility_description')}
      </p>
    </div>
  );
};

CheckoutUtility.propTypes = {
  totalCostUtility: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
};
