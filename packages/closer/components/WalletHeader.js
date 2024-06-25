import { useContext } from 'react';

import { useTranslations } from 'next-intl';

import { WalletState } from '../contexts/wallet';

const WalletHeader = ({ isInsufficientBalance }) => {
  const t = useTranslations();

  const {
    isWalletConnected,
    isCorrectNetwork,
    isWalletReady,
    hasSameConnectedAccount,
  } = useContext(WalletState);

  const getTitle = () => {
    if (!isWalletConnected) {
      return t('wallet_not_connected_title');
    }
    if (!isCorrectNetwork) {
      return t('wallet_incorrect_network');
    }
    if (isInsufficientBalance) {
      return t('wallet_booking_insufficient_balance');
    }
    if (!hasSameConnectedAccount) {
      return t('wallet_different_saved_address_title');
    }
    return t('wallet_connected_title');
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
