import PropTypes from 'prop-types';

import { __ } from '../utils/helpers';

export const CurrencySwitch = ({ currencies, selectedCurrency, onSelect }) => {
  const activeClass =
    'flex-1 bg-black text-white rounded-3xl text-center uppercase text-xs h-full flex items-center justify-center';
  const inactiveClass =
    'flex-1 bg-none text-black text-center uppercase text-xs';
  return (
    <div className="h-9 border border-solid border-neutral-400 rounded-3xl p-1 font-normal flex justify-between items-center">
      {currencies.map((currency) => (
        <button
          key={currency}
          className={
            selectedCurrency === currency ? activeClass : inactiveClass
          }
          onClick={() => onSelect(currency)}
        >
          {__(`currency_switch_${currency}_title`)}
        </button>
      ))}
    </div>
  );
};

CurrencySwitch.propTypes = {
  currencies: PropTypes.arrayOf(PropTypes.string),
  selectedCurrency: PropTypes.string,
  onSelect: PropTypes.func,
};
