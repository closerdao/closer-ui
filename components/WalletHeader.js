import { useWallet } from '../hooks/useWallet';
import { __ } from '../utils/helpers';

const WalletHeader = ({ isInsufficientBalance }) => {
  const { isWalletConnected } = useWallet();

  return (
    <div className="flex items-center border-b border-[#e1e1e1] border-solid pb-2">
      {isWalletConnected && !isInsufficientBalance ? (
        <span className="mr-1">🟢</span>
      ) : (
        <span className="mr-1">🔴</span>
      )}
      <p>
        {isWalletConnected && !isInsufficientBalance
          ? __('wallet_connected_title')
          : __('wallet_not_connected_title')}
        {isInsufficientBalance && __('wallet_booking_insufficient_balance')}
      </p>
    </div>
  );
};

export default WalletHeader;
