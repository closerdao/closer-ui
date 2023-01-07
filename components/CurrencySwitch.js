import { useContext } from 'react';

import PropTypes from 'prop-types';

import { WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';

const CurrencySwitch = ({ currencies, selectedCurrency, onSelect }) => {
  const { isWalletConnected } = useContext(WalletState);
  const activeClass =
    'flex-1 bg-black text-white rounded-3xl text-center uppercase text-xs h-full flex items-center justify-center';
  const inactiveClass =
    'flex-1 bg-none text-black text-center uppercase text-xs disabled:text-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed';

  return (
    <div className="h-9 border border-solid border-neutral-400 rounded-3xl p-1 font-normal flex justify-between items-center">
      {currencies.map((currency) => {
        return (
          <button
            key={currency}
            className={
              selectedCurrency === currency ? activeClass : inactiveClass
            }
            onClick={() => onSelect(currency)}
            disabled={currency === 'TDF' && !isWalletConnected}
            title={
              !isWalletConnected &&
              currency === 'TDF' &&
              __('wallet_not_connected_button_title')
            }
          >
            {__(`currency_switch_${currency}_title`)}
          </button>
        );
      })}
    </div>
  );
};

CurrencySwitch.propTypes = {
  currencies: PropTypes.arrayOf(PropTypes.string),
  selectedCurrency: PropTypes.string,
  onSelect: PropTypes.func,
};

export default CurrencySwitch;
