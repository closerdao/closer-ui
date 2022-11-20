import PropTypes from 'prop-types';

import { CURRENCIES } from '../utils/const';
import { __, priceFormat } from '../utils/helpers';
import { CurrencySwitch } from './CurrencySwitch';
import PlusIcon from './icons/PlusIcon';

export const ListingPrice = ({
  fiatPrice,
  tokenPrice,
  utilityFiat,
  selectedCurrency,
  selectCurrency,
}) => {
  const isFiatSelected = selectedCurrency === fiatPrice.cur;
  return (
    <div>
      <CurrencySwitch
        selectedCurrency={selectedCurrency}
        onSelect={selectCurrency}
        currencies={CURRENCIES}
      />
      <div className="flex items-center justify-center mt-8">
        <div className="flex-1 flex flex-col items-center">
          <p className="text-2xl leading-9">
            {priceFormat(isFiatSelected ? fiatPrice : tokenPrice)}
          </p>
          <p>{__('bookings_price_switch_accomodation')}</p>
        </div>
        <div>
          <PlusIcon width={16} height={16} />
        </div>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-2xl leading-9">{priceFormat(utilityFiat)}</p>
          <p>{__('bookings_price_switch_utility')}</p>
        </div>
      </div>
    </div>
  );
};

ListingPrice.propTypes = {
  fiatPrice: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  tokenPrice: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
  utilityFiat: PropTypes.shape({
    val: PropTypes.number,
    cur: PropTypes.string,
  }),
};
