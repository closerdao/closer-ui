import React, { useContext } from 'react';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';
import { usePresenceToken } from 'closer/hooks/usePresenceToken';
import { useSweatToken } from 'closer/hooks/useSweatToken';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
import { useTranslations } from 'next-intl';

interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const {
    account,
    isWalletConnected,
    balanceAvailable: tdfBalance,
  } = useContext(WalletState);
  
  const { user } = useAuth();
  const { connectWallet } = useContext(WalletDispatch);
  const { presenceBalance } = usePresenceToken();
  const { sweatBalance } = useSweatToken();
  const { votingWeight } = useVotingWeight();
  const t = useTranslations();
  
  const isCitizen = (): boolean => {
    // Check if user has the "citizen" role
    return user?.roles?.includes('member') || false;
  };
  
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <h2 className="text-xl font-bold mb-4">
        {t('governance_wallet_voting_power')}
      </h2>
      
      {!isWalletConnected ? (
        <div>
          <button
            onClick={connectWallet}
            className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded w-full"
          >
            {t('governance_connect_wallet')}
          </button>
          <p className="mt-2 text-sm text-gray-500">
            {t('governance_connect_wallet_description')}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">{t('governance_address')}:</span>
            <span className="text-sm text-gray-500">{formatAddress(account || '')}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">{t('governance_tdf_balance')}:</span>
            <span>{tdfBalance || '0'}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">{t('governance_presence')}:</span>
            <span>{presenceBalance || '0'}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">{t('governance_sweat')}:</span>
            <span>{sweatBalance}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3 font-bold">
            <span>{t('governance_voting_weight_label')}:</span>
            <span>{votingWeight.toFixed(2)}</span>
          </div>
          
          {!isCitizen() && (
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
              <p className="text-sm">
                <strong>{t('governance_note')}:</strong>{' '}
                {t('governance_need_citizen_to_vote')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
