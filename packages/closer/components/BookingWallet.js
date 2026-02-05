import { useContext } from 'react';

import { WalletState } from '../contexts/wallet';
import { MIN_CELO_FOR_GAS } from '../constants';
import { useConfig } from '../hooks/useConfig';
import { priceFormat } from '../utils/helpers';
import WalletActions from './WalletActions';
import WalletHeader from './WalletHeader';
import { useTranslations } from 'next-intl';
import { ErrorMessage } from './ui';

const BookingWallet = ({ toPay, switchToFiat }) => {
  const t = useTranslations();

  const { BLOCKCHAIN_DAO_TOKEN } = useConfig();
  const { balanceAvailable, isWalletReady, balanceNativeAvailable } =
    useContext(WalletState);
  const balanceAfterPayment = balanceAvailable - toPay;
  const isInsufficientBalance = balanceAfterPayment < 0;
  const hasInsufficientCeloForGas =
    isWalletReady &&
    Number(balanceNativeAvailable ?? 0) < MIN_CELO_FOR_GAS;

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      <WalletHeader />
      {hasInsufficientCeloForGas && (
        <div
          className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-amber-800"
          role="alert"
        >
          <span className="text-amber-500 text-xl shrink-0" aria-hidden>
            ⚠️
          </span>
          <p className="text-sm font-medium">
            {t('insufficient_celo_for_gas')}
          </p>
        </div>
      )}
      {isWalletReady ? (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <p>{t('wallet_booking_available_balance')}</p>
            <p className="font-bold">
              {priceFormat(balanceAvailable, BLOCKCHAIN_DAO_TOKEN.symbol)}
            </p>
          </div>
          {!isInsufficientBalance ? (
            <div className="flex justify-between items-center">
              <p>{t('wallet_booking_after_payment')}</p>
              <p className="font-bold">
                {priceFormat(balanceAfterPayment, BLOCKCHAIN_DAO_TOKEN.symbol)}
              </p>
            </div>
          ) : (
            <div>
              <button className="btn mt-4 w-full uppercase" onClick={switchToFiat}>
                {t('booking_pay_in_euro')}
              </button>
              <ErrorMessage error={t('error_insufficient_token_balance')}/>
            </div>
          )}
        </div>
      ) : null}
      <WalletActions />
    </div>
  );
};

export default BookingWallet;
