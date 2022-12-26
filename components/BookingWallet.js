import { useWallet } from '../hooks/useWallet';
import { __, priceFormat } from '../utils/helpers';
import WalletActions from './WalletActions';
import WalletHeader from './WalletHeader';

const BookingWallet = ({ accomodationCost, switchToEUR }) => {
  const { balanceAvailable, isWalletConnected, tokenSymbol, isCorrectNetwork } =
    useWallet();
  const balanceAfterPayment = balanceAvailable - accomodationCost;
  const isInsufficientBalance = balanceAfterPayment < 0;

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      <WalletHeader />
      {isWalletConnected && isCorrectNetwork ? (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <p>{__('wallet_booking_available_balance')}</p>
            <p className="font-bold">
              {priceFormat(balanceAvailable, tokenSymbol)}
            </p>
          </div>
          {!isInsufficientBalance ? (
            <div className="flex justify-between items-center">
              <p>{__('wallet_booking_after_payment')}</p>
              <p className="font-bold">
                {priceFormat(balanceAfterPayment, tokenSymbol)}
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
