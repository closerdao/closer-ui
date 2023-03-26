import PropTypes from 'prop-types';

import { DEFAULT_CURRENCY } from '../constants';
import { useConfig } from '../hooks/useConfig';
import { __, priceFormat } from '../utils/helpers';

const SummaryCosts = ({
  utilityFiat,
  accomodationCost,
  useTokens,
  totalToken,
  totalFiat,
}) => {
  const { BLOCKCHAIN_DAO_TOKEN } = useConfig();

  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3">
        <span className="mr-1">💰</span>
        <span>{__('bookings_summary_step_costs_title')}</span>
      </h2>
      <div className="flex justify-between items-center mt-3">
        <p>{__('bookings_summary_step_dates_accomodation_type')}</p>
        <p className="font-bold">{priceFormat(accomodationCost)}</p>
      </div>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_summary_step_utility_total')}</p>
        <p className="font-bold">{priceFormat(utilityFiat)}</p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_summary_step_utility_description')}
      </p>
      <div className="flex justify-between items-center mt-3">
        <p>{__('bookings_total')}</p>
        <p className="font-bold">
          {useTokens ? (
            <>
              <span>
                {priceFormat(totalToken, BLOCKCHAIN_DAO_TOKEN.symbol)}
              </span>{' '}
              + <span>{priceFormat(totalFiat)}</span>
            </>
          ) : (
            priceFormat(totalFiat, DEFAULT_CURRENCY)
          )}
        </p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_checkout_step_total_description')}
      </p>
    </div>
  );
};

SummaryCosts.propTypes = {
  utilityFiat: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  accomodationCost: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  useTokens: PropTypes.bool.isRequired,
  totalToken: PropTypes.number.isRequired,
  totalFiat: PropTypes.number.isRequired,
};

export default SummaryCosts;
