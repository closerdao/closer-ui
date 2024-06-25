import { useContext } from 'react';

import { WalletState } from '../contexts/wallet';
import WalletActions from './WalletActions';
import WalletHeader from './WalletHeader';
import { useTranslations } from 'next-intl';


const Wallet = () => {
  const t = useTranslations();

  const {
    balanceTotal,
    balanceAvailable,
    proofOfPresence,
    isWalletReady,
    hasSameConnectedAccount,
    isWalletConnected,
    isCorrectNetwork,
    balanceCeurAvailable,
  } = useContext(WalletState);

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      <WalletHeader />
      {isWalletReady && (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <p>{t('wallet_ceur')}</p>
            <p className="font-bold">{balanceCeurAvailable.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>{t('wallet_tdf')}</p>
            <p className="font-bold">{balanceTotal}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>{t('wallet_tdf_available')}</p>
            <p className="font-bold">{balanceAvailable}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>{t('wallet_pop')}</p>
            <p className="font-bold">{proofOfPresence}</p>
          </div>
        </div>
      )}
      {isWalletConnected && isCorrectNetwork && !hasSameConnectedAccount && (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <p>{t('wallet_different_saved_address')}</p>
          </div>
        </div>
      )}
      <WalletActions />
    </div>
  );
};

export default Wallet;
