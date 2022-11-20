import PropTypes from 'prop-types';

import { CURRENCIES } from '../utils/const';
import { __, priceFormat } from '../utils/helpers';
import { CurrencySwitch } from './CurrencySwitch';

export const CheckoutAccomodation = ({
  selectCurrency,
  selectedCurrency,
  listingName,
  totalCostFiat,
  totalCostToken,
}) => {
  const isTokenSelected = selectedCurrency === totalCostToken.cur;
  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3">
        <span className="mr-1">🏡</span>
        <span>{__('bookings_checkout_step_accomodation_title')}</span>
      </h2>
      <CurrencySwitch
        currencies={CURRENCIES}
        onSelect={selectCurrency}
        selectedCurrency={selectedCurrency}
      />
      <div className="flex justify-between items-top mt-16">
        <p>{listingName}</p>
        <div>
          <p className="font-bold">
            {isTokenSelected
              ? priceFormat(totalCostToken)
              : priceFormat(totalCostFiat)}
          </p>
        </div>
      </div>
    </div>
  );
};

CheckoutAccomodation.propTypes = {
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

CheckoutAccomodation.defaultProps = {
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
