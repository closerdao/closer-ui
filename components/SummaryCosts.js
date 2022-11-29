import PropTypes from 'prop-types';

import { BLOCKCHAIN_DAO_TOKEN } from '../config_blockchain';
import { __, priceFormat } from '../utils/helpers';

const SummaryCosts = ({
  utilityFiat,
  accomodationCost,
  useToken,
  totalToPayInToken,
  totalToPayInFiat,
}) => {
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
        <p> {__('bookings_total')}</p>
        <p className="font-bold">
          {useToken ? (
            <>
              <span>
                {priceFormat(totalToPayInToken, BLOCKCHAIN_DAO_TOKEN.symbol)}
              </span>{' '}
              + <span>{priceFormat(totalToPayInFiat)}</span>
            </>
          ) : (
            priceFormat(totalToPayInFiat)
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
  useToken: PropTypes.bool.isRequired,
  totalToPayInToken: PropTypes.number.isRequired,
  totalToPayInFiat: PropTypes.number.isRequired,
};

SummaryCosts.defaultProps = {
  selectCurrency: () => {},
  selectedCurrency: '',
  listingName: '',
  rentalFiat: {
    val: 0,
    cur: 'EUR',
  },
  rentalToken: {
    val: 0,
    cur: 'TDF',
  },
};

export default SummaryCosts;
