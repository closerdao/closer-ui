import { Dispatch, SetStateAction, useContext } from 'react';

import { WalletState } from '../../contexts/wallet';
import { CloserCurrencies } from '../../types';
import Switcher from '../ui/Switcher';

interface Props {
  currencies: string[] | null;
  selectedCurrency: string | CloserCurrencies;
  onSelect: Dispatch<SetStateAction<string | CloserCurrencies>>;
  className?: string;
  optionsTitles?: string[];
}

const CurrencySwitcher = ({
  currencies,
  selectedCurrency,
  onSelect,
  className,
  optionsTitles,
}: Props) => {
  const { isWalletConnected, isCorrectNetwork, hasSameConnectedAccount } =
    useContext(WalletState);
  const isWeb3BookingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';

  return (
    <div className={`${className ? className : ''}`}>
      <Switcher
        options={currencies}
        selectedOption={selectedCurrency}
        setSelectedOption={onSelect}
        optionsTitles={optionsTitles}
        isTokenPaymentAvailable={
          isWalletConnected &&
          isWeb3BookingEnabled &&
          isCorrectNetwork &&
          hasSameConnectedAccount
        }
      />
    </div>
  );
};

export default CurrencySwitcher;
