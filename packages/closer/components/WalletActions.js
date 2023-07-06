import { useContext } from 'react';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';
import { Button } from './ui';

const WalletActions = () => {
  const { switchNetwork, connectWallet } = useContext(WalletDispatch);
  const { isCorrectNetwork, isWalletConnected } = useContext(WalletState);

  if (isWalletConnected && !isCorrectNetwork) {
    return (
      <Button type='secondary' className=" mt-4 w-full uppercase" onClick={switchNetwork}>
        {__('wallet_switch_network')}
      </Button>
    );
  }

  if (!isWalletConnected) {
    return (
      <>
        <p className="my-4 text-xs">{__('wallet_not_connected_cta')}</p>
        <Button type='secondary' className=" mt-4 w-full uppercase" onClick={connectWallet}>
          {__('wallet_not_connected_button')}
        </Button>
      </>
    );
  }

  return null;
};

export default WalletActions;
