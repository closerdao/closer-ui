import { useWallet } from '../hooks/useWallet';
import { __ } from '../utils/helpers';

const WalletActions = () => {
  const { isCorrectNetwork, switchNetwork, connectWallet, isWalletConnected } =
    useWallet();

  if (!isCorrectNetwork) {
    return (
      <button className="btn mt-4 w-full uppercase" onClick={switchNetwork}>
        {__('wallet_switch_network')}
      </button>
    );
  }

  if (!isWalletConnected) {
    return (
      <>
        <p className="my-4 text-xs">{__('wallet_not_connected_cta')}</p>
        <button className="btn mt-4 w-full uppercase" onClick={connectWallet}>
          {__('wallet_not_connected_button')}
        </button>
      </>
    );
  }
  return null;
};

export default WalletActions;
