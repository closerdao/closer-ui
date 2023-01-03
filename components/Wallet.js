import { useContext } from 'react';

import { WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';
import WalletActions from './WalletActions';
import WalletHeader from './WalletHeader';

const Wallet = () => {
  const { balanceTotal, balanceAvailable, proofOfPresence, isWalletReady } =
    useContext(WalletState);

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      <WalletHeader />
      {isWalletReady ? (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <p>{__('wallet_tdf')}</p>
            <p className="font-bold">{balanceTotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>{__('wallet_tdf_available')}</p>
            <p className="font-bold">{balanceAvailable.toFixed(2)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>{__('wallet_pop')}</p>
            <p className="font-bold">{proofOfPresence}</p>
          </div>
        </div>
      ) : null}
      <WalletActions />
    </div>
  );
};

export default Wallet;
