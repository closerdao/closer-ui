import { useContext } from 'react';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';

const WalletActions = () => {
  const { switchNetwork, connectWallet } = useContext(WalletDispatch);
  const { isCorrectNetwork, isWalletConnected } = useContext(WalletState);

  if (isWalletConnected && !isCorrectNetwork) {
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
          {__('wallet_not_connected_button')} +
        </button>
      </>
    );
  }
  return null;
};

export default WalletActions;
