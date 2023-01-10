import Link from 'next/link';

import { useContext } from 'react';

import { useAuth } from '../contexts/auth';
import { WalletDispatch, WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';

const WalletActions = () => {
  const { switchNetwork, connectWallet } = useContext(WalletDispatch);
  const { isCorrectNetwork, isWalletConnected, hasSameConnectedAccount } =
    useContext(WalletState);
  const { user } = useAuth();

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
          {__('wallet_not_connected_button')}
        </button>
      </>
    );
  }

  if (!hasSameConnectedAccount) {
    return (
      <Link href={`/members/${user.slug}`}>
        <a>
          <button className="btn mt-4 w-full uppercase">
            {__('buttons_edit_profile')}
          </button>
        </a>
      </Link>
    );
  }
  return null;
};

export default WalletActions;
