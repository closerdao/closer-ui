import { useWallet } from '../hooks/useWallet';
import { __ } from '../utils/helpers';

const WalletHeader = ({ isInsufficientBalance }) => {
  const { isWalletConnected, isCorrectNetwork } = useWallet();

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
    return __('wallet_connected_title');
  };

  return (
    <div className="flex items-center border-b border-[#e1e1e1] border-solid pb-2">
      {!isInsufficientBalance && isWalletConnected && isCorrectNetwork ? (
        <span className="mr-1">🟢</span>
      ) : (
        <span className="mr-1">🔴</span>
      )}
      <p>{getTitle()}</p>
    </div>
  );
};

export default WalletHeader;
