import { useContext } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { WalletDispatch, WalletState } from '../contexts/wallet';
import { userNeedsWalletLinked } from '../utils/auth.helpers';
import { Button } from './ui';

const WalletActions = () => {
  const t = useTranslations();
  const { user } = useAuth();

  const { switchNetwork, connectWallet } = useContext(WalletDispatch);
  const { isCorrectNetwork, isWalletConnected } = useContext(WalletState);

  if (isWalletConnected && !isCorrectNetwork) {
    return (
      <Button
        variant="secondary"
        className=" mt-4 w-full uppercase"
        onClick={switchNetwork}
      >
        {t('wallet_switch_network')}
      </Button>
    );
  }

  const profileHasNoWallet = userNeedsWalletLinked(user);
  const showConnectWallet = !isWalletConnected || profileHasNoWallet;

  if (showConnectWallet) {
    return (
      <>
        <p className="my-4 text-xs">{t('wallet_not_connected_cta')}</p>
        <Button
          variant="secondary"
          className=" mt-4 w-full uppercase"
          onClick={() => {
            connectWallet();
          }}
        >
          {t('wallet_not_connected_button')}
        </Button>
      </>
    );
  }

  return null;
};

export default WalletActions;
