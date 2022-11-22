import PropTypes from 'prop-types';

import { __, priceFormat } from '../utils/helpers';

export const SummaryCosts = ({
  selectedCurrency,
  totalCostFiat,
  totalCostToken,
  totalCostUtility,
}) => {
  const isTokenSelected = selectedCurrency === totalCostToken.cur;
  const totalValue = isTokenSelected
    ? totalCostToken.val
    : totalCostFiat.val + totalCostUtility.val;
  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3">
        <span className="mr-1">💰</span>
        <span>{__('bookings_summary_step_costs_title')}</span>
      </h2>
      <div className="flex justify-between items-center mt-3">
        <p>{__('bookings_summary_step_dates_accomodation_type')}</p>
        <p className="font-bold">
          {isTokenSelected
            ? priceFormat(totalCostToken)
            : priceFormat(totalCostFiat)}
        </p>
      </div>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_summary_step_utility_total')}</p>
        <p className="font-bold">{priceFormat(totalCostUtility)}</p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_summary_step_utility_description')}
      </p>
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

SummaryCosts.propTypes = {
  selectCurrency: PropTypes.func,
  selectedCurrency: PropTypes.string,
  listingName: PropTypes.string,
  totalCostFiat: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  totalCostToken: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
};

SummaryCosts.defaultProps = {
  selectCurrency: () => {},
  selectedCurrency: '',
  listingName: '',
  totalCostFiat: {
    val: 0,
    cur: 'EUR',
  },
  totalCostToken: {
    val: 0,
    cur: 'TDF',
  },
};
