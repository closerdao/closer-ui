import { useContext } from 'react';

import { useTranslations } from 'next-intl';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { Button } from './ui';

const WalletActions = () => {
  const t = useTranslations();

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

  if (!isWalletConnected) {
    return (
      <>
        <p className="my-4 text-xs">{t('wallet_not_connected_cta')}</p>
        <Button
          variant="secondary"
          className=" mt-4 w-full uppercase"
          onClick={() => {
            console.log('[WalletActions] Connect wallet button clicked');
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
