import { useContext } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { WalletState } from '../contexts/wallet';
import { useConfig } from '../hooks/useConfig';
import { useSweatToken } from '../hooks/useSweatToken';
import { userHasLinkedWallet } from '../utils/auth.helpers';
import { getReserveTokenDisplay } from '../utils/config.utils';
import WalletActions from './WalletActions';
import WalletHeader from './WalletHeader';

const BalanceRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-dashed border-gray-100 last:border-0">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-bold font-mono text-sm">{value}</p>
  </div>
);

const Wallet = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const config = useConfig();
  const reserveToken = getReserveTokenDisplay(config);
  const { sweatBalance } = useSweatToken();

  const {
    balanceTotal,
    balanceAvailable,
    proofOfPresence,
    isWalletReady,
    hasSameConnectedAccount,
    isWalletConnected,
    isCorrectNetwork,
    balanceCeurAvailable,
    balanceCeloAvailable,
  } = useContext(WalletState);

  return (
    <div className="flex flex-col rounded-lg shadow-4xl overflow-hidden">
      <WalletHeader />
      <div className="p-4">
        {isWalletReady && (
          <div className="flex flex-col">
            <BalanceRow
              label={t('wallet_ceur', { reserveToken })}
              value={balanceCeurAvailable?.toFixed(2)}
            />
            <BalanceRow
              label={t('wallet_celo')}
              value={balanceCeloAvailable?.toFixed(2)}
            />
            <BalanceRow
              label={t('wallet_tdf')}
              value={balanceTotal?.toFixed(2)}
            />
            <BalanceRow
              label={t('wallet_tdf_available')}
              value={balanceAvailable?.toFixed(2)}
            />
            <BalanceRow
              label={t('wallet_pop')}
              value={proofOfPresence?.toFixed(2)}
            />
            <BalanceRow
              label={t('wallet_sweat')}
              value={Number(sweatBalance).toFixed(2)}
            />
          </div>
        )}
        {userHasLinkedWallet(user) &&
          isWalletConnected &&
          isCorrectNetwork &&
          !hasSameConnectedAccount && (
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between items-center">
              <p>{t('wallet_different_saved_address')}</p>
            </div>
          </div>
        )}
        <WalletActions />
      </div>
    </div>
  );
};

export default Wallet;
