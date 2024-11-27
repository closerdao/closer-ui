import { useContext } from 'react';

import { WalletState } from '../contexts/wallet';
import { useConfig } from '../hooks/useConfig';
import { priceFormat } from '../utils/helpers';
import WalletActions from './WalletActions';
import WalletHeader from './WalletHeader';
import { useTranslations } from 'next-intl';
import { ErrorMessage } from './ui';


const BookingWallet = ({ toPay, switchToFiat }) => {
  const t = useTranslations();
  
  const { BLOCKCHAIN_DAO_TOKEN } = useConfig();
  const { balanceAvailable, isWalletReady } = useContext(WalletState);
  const balanceAfterPayment = balanceAvailable - toPay;
  const isInsufficientBalance = balanceAfterPayment < 0;

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      <WalletHeader />
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
