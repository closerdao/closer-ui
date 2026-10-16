import { useContext, useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { WalletDispatch, WalletState } from '../contexts/wallet';
import { userNeedsWalletLinked } from '../utils/auth.helpers';
import { getBlockchainNetworkName } from '../utils/blockchainNetwork';
import { logMetric } from '../utils/metrics';
import WalletConnectionStatus from './WalletConnectionStatus';
import WalletDisplay from './display/walletDisplay';
import { Button } from './ui';

const WalletActions = ({ requireBalance = false, requireProfile = true }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const { switchNetwork, connectWallet, selectWallet, refreshBalances } =
    useContext(WalletDispatch);
  const {
    account,
    isCorrectNetwork,
    isWalletConnected,
    hasSameConnectedAccount,
    initializationStatus,
    isWalletConnecting,
    isWalletSwitchingNetwork,
    balanceStatus,
  } = useContext(WalletState);

  const wasWalletConnectedRef = useRef(false);
  useEffect(() => {
    if (!isWalletConnected) {
      wasWalletConnectedRef.current = false;
      return;
    }
    if (wasWalletConnectedRef.current) return;
    wasWalletConnectedRef.current = true;
    void logMetric({
      event: 'wallet-connect-success',
      category: 'wallet',
      value: 'connect-success',
    });
  }, [isWalletConnected]);

  if (initializationStatus === 'disabled') return null;
  if (
    initializationStatus === 'loading' ||
    initializationStatus === 'error' ||
    isWalletConnecting
  )
    return <WalletConnectionStatus />;

  if (
    requireProfile &&
    isWalletConnected &&
    user?.walletAddress &&
    !hasSameConnectedAccount
  ) {
    return (
      <>
        <WalletConnectionStatus />
        <div className="space-y-2 rounded-lg border border-pending/40 bg-pending/10 p-3">
          <p className="text-sm leading-snug text-foreground">
            {account
              ? t.rich('wallet_different_saved_address_accounts', {
                  connected: () => (
                    <WalletDisplay
                      address={account}
                      variant="inline"
                      showCopy={false}
                    />
                  ),
                  profile: () => (
                    <WalletDisplay
                      address={user.walletAddress}
                      variant="inline"
                      showCopy={false}
                    />
                  ),
                })
              : t('wallet_different_saved_address')}
          </p>
          <Button
            type="button"
            size="small"
            isFullWidth={false}
            className="px-3 py-1 text-xs normal-case tracking-normal hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            onClick={selectWallet}
          >
            {t('wallet_switch_wallet')}
          </Button>
        </div>
      </>
    );
  }

  const profileHasNoWallet = requireProfile && userNeedsWalletLinked(user);
  if (isWalletConnected && !profileHasNoWallet && !isCorrectNetwork) {
    return (
      <div className="space-y-2">
        <WalletConnectionStatus />
        <p className="text-sm">
          {t('wallet_network_required', {
            network: getBlockchainNetworkName(),
          })}
        </p>
        <Button
          type="button"
          variant="secondary"
          className=" mt-4 w-full uppercase"
          onClick={switchNetwork}
          isLoading={isWalletSwitchingNetwork}
        >
          {t(
            isWalletSwitchingNetwork
              ? 'wallet_confirm_switch'
              : 'wallet_switch_to_network',
            { network: getBlockchainNetworkName() },
          )}
        </Button>
      </div>
    );
  }

  const showConnectWallet = !isWalletConnected || profileHasNoWallet;

  if (showConnectWallet) {
    return (
      <>
        <WalletConnectionStatus />
        <p className="my-4 text-xs">{t('wallet_not_connected_cta')}</p>
        <Button
          type="button"
          variant="secondary"
          className=" mt-4 w-full uppercase"
          onClick={() => {
            void logMetric({
              event: 'wallet-connect-clicked',
              category: 'wallet',
              value: 'connect-click',
            });
            connectWallet();
          }}
        >
          {t(
            isWalletConnected && profileHasNoWallet
              ? 'wallet_verify_ownership'
              : 'wallet_not_connected_button',
          )}
        </Button>
      </>
    );
  }

  if (requireBalance && balanceStatus !== 'ready')
    return (
      <div className="space-y-2">
        <WalletConnectionStatus />
        <p role="status">
          {t(
            balanceStatus === 'error'
              ? 'wallet_error_balance_failed'
              : 'wallet_loading_balances',
          )}
        </p>
        {balanceStatus === 'error' && (
          <Button type="button" variant="secondary" onClick={refreshBalances}>
            {t('wallet_retry_balances')}
          </Button>
        )}
      </div>
    );
  return <WalletConnectionStatus />;
};

export default WalletActions;
