import { useContext } from 'react';
import { useTranslations } from 'next-intl';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import { Button } from './ui';

const WalletActions = () => {
  const t = useTranslations();
  const { switchNetwork } = useContext(WalletDispatch);
  const { isCorrectNetwork, isWalletConnected } = useContext(WalletState);

  if (isWalletConnected && !isCorrectNetwork) {
    return (
      <Button
        variant="secondary"
        className="mt-4 w-full uppercase"
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
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button
              variant="secondary"
              className="mt-4 w-full uppercase"
              onClick={openConnectModal}
            >
              {t('wallet_not_connected_button')}
            </Button>
          )}
        </ConnectButton.Custom>
      </>
    );
  }

  return null;
};

export default WalletActions;
