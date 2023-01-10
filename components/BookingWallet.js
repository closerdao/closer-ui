import { useContext } from 'react';

import { BLOCKCHAIN_DAO_TOKEN } from '../config_blockchain';
import { WalletState } from '../contexts/wallet';
import { __, priceFormat } from '../utils/helpers';
import WalletActions from './WalletActions';
import WalletHeader from './WalletHeader';

const BookingWallet = ({ toPay, switchToEUR }) => {
  const { balanceAvailable, isWalletReady } = useContext(WalletState);
  const balanceAfterPayment = balanceAvailable - toPay;
  const isInsufficientBalance = balanceAfterPayment < 0;

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      <WalletHeader />
      {isWalletReady ? (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <p>{__('wallet_booking_available_balance')}</p>
            <p className="font-bold">
              {priceFormat(balanceAvailable, BLOCKCHAIN_DAO_TOKEN.symbol)}
            </p>
          </div>
          {!isInsufficientBalance ? (
            <div className="flex justify-between items-center">
              <p>{__('wallet_booking_after_payment')}</p>
              <p className="font-bold">
                {priceFormat(balanceAfterPayment, BLOCKCHAIN_DAO_TOKEN.symbol)}
              </p>
            </div>
          ) : (
            <button className="btn mt-4 w-full uppercase" onClick={switchToEUR}>
              Pay in Euro
            </button>
          )}
        </div>
      ) : null}
      <WalletActions />
    </div>
  );
};

export default BookingWallet;
