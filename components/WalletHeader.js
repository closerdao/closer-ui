import { useContext } from 'react';

import { WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';

const WalletHeader = ({ isInsufficientBalance }) => {
  const {
    isWalletConnected,
    isCorrectNetwork,
    isWalletReady,
    hasSameConnectedAccount,
  } = useContext(WalletState);

  const getTitle = () => {
    if (!isWalletConnected) {
      return __('wallet_not_connected_title');
    }
    if (!isCorrectNetwork) {
      return __('wallet_incorrect_network');
    }
    if (isInsufficientBalance) {
      return __('wallet_booking_insufficient_balance');
    }
    if (!hasSameConnectedAccount) {
      return __('wallet_different_saved_address_title');
    }
    return __('wallet_connected_title');
  };

  return (
    <div className="flex items-center border-b border-[#e1e1e1] border-solid pb-2">
      {!isInsufficientBalance && isWalletReady ? (
        <span className="mr-1">🟢</span>
      ) : (
        <span className="mr-1">🔴</span>
      )}
      <p>{getTitle()}</p>
    </div>
  );
};

export default WalletHeader;