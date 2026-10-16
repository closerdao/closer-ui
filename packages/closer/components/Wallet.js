import { useContext } from 'react';

import { useTranslations } from 'next-intl';

import { WalletState } from '../contexts/wallet';
import { useConfig } from '../hooks/useConfig';
import { useSweatToken } from '../hooks/useSweatToken';
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
  const config = useConfig();
  const reserveToken = getReserveTokenDisplay(config);
  const { sweatBalance } = useSweatToken();

  const {
    balanceTotal,
    balanceAvailable,
    proofOfPresence,
    isWalletReady,
    balanceStatus,
    balanceCeurAvailable,
    balanceCeloAvailable,
  } = useContext(WalletState);

  return (
    <div className="flex flex-col rounded-lg shadow-4xl overflow-hidden">
      <WalletHeader />
      <div className="p-4">
        {isWalletReady && balanceStatus === 'ready' && (
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
        <WalletActions requireBalance />
      </div>
    </div>
  );
};

export default Wallet;
