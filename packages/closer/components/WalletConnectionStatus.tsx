import { useTranslations } from 'next-intl';

import { useWallet } from '../contexts/wallet/hooks';

export default function WalletConnectionStatus() {
  const t = useTranslations();
  const {
    initializationStatus,
    initializationSlow,
    connectionStage,
    isAppKitModalOpen,
    error,
    cancelWalletConnection,
  } = useWallet();
  return (
    <div className="space-y-2 text-sm">
      {initializationStatus === 'loading' && (
        <p role="status">
          {t(initializationSlow ? 'wallet_loading_slow' : 'wallet_loading')}
        </p>
      )}
      {connectionStage === 'connecting' && (
        <div role="status">
          <p>{t('wallet_waiting_approval')}</p>
          {!isAppKitModalOpen && (
            <button
              type="button"
              className="text-accent underline mt-2"
              onClick={cancelWalletConnection}
            >
              {t('wallet_stop_waiting')}
            </button>
          )}
        </div>
      )}
      {connectionStage === 'linking' && (
        <p role="status">{t('wallet_linking')}</p>
      )}
      {error && (
        <p role="alert" className="text-system-error">
          {t(`wallet_error_${error.code || 'connection_failed'}`)}
        </p>
      )}
      {initializationStatus === 'error' && (
        <button
          type="button"
          className="text-accent underline"
          onClick={() => window.location.reload()}
        >
          {t('wallet_reload')}
        </button>
      )}
    </div>
  );
}
