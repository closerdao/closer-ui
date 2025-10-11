import React, { useContext, useState, useEffect } from 'react';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';
import { useTranslations } from 'next-intl';

interface WalletAndVotingProps {
  className?: string;
}

const WalletAndVoting: React.FC<WalletAndVotingProps> = ({ className }) => {
  const {
    account,
    isWalletConnected,
    isWalletReady,
    isCorrectNetwork,
    hasSameConnectedAccount,
    balanceTotal,
    proofOfPresence,
    error,
  } = useContext(WalletState);
  
  const { user } = useAuth();
  const { connectWallet } = useContext(WalletDispatch);
  const t = useTranslations();
  
  const [votingWeight, setVotingWeight] = useState<number>(0);

  const isCitizen = (): boolean => {
    return user?.roles?.includes('member') || false;
  };
  
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance: string | undefined): string => {
    return parseFloat(balance || '0').toFixed(2);
  };

  // Calculate voting weight from actual wallet data
  useEffect(() => {
    if (!isWalletReady) {
      setVotingWeight(0);
      return;
    }

    // Parse TDF balance (using balanceTotal which includes staked tokens)
    const tdfValue = parseFloat(balanceTotal || '0');
    
    // Parse Presence balance (proofOfPresence from wallet context)
    const presenceValue = parseFloat(proofOfPresence || '0');
    
    // Mock Sweat balance (would be fetched from blockchain in real implementation)
    const sweatValue = 0.4;
    const sweatWeighted = sweatValue * 5;
    
    // Calculate total voting weight
    const totalWeight = tdfValue + presenceValue + sweatWeighted;
    
    setVotingWeight(totalWeight);
  }, [isWalletReady, balanceTotal, proofOfPresence]);

  const getNetworkStatus = () => {
    if (!isWalletConnected) return { status: 'disconnected', message: t('governance_wallet_not_connected') };
    if (!isCorrectNetwork) return { status: 'wrong-network', message: t('governance_wrong_network') };
    if (!hasSameConnectedAccount) return { status: 'wrong-account', message: t('governance_account_mismatch') };
    return { status: 'connected', message: t('governance_connected') };
  };

  const networkStatus = getNetworkStatus();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('governance_wallet_voting_power')}</h2>
        
        {!isWalletConnected ? (
          <div className="text-center">
            <button
              onClick={connectWallet}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {t('governance_connect_wallet')}
            </button>
            <p className="mt-3 text-sm text-gray-500">
              {t('governance_connect_wallet_description')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">{t('governance_wallet_status')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  networkStatus.status === 'connected' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {networkStatus.status === 'connected' ? t('governance_connected') : networkStatus.message}
                </span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">{t('governance_address')}: </span>
                <span className="font-mono text-gray-900">{formatAddress(account || '')}</span>
              </div>
            </div>

            {/* Token Balances - Only relevant ones */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">{t('governance_token_balances')}</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">TDF</span>
                  <span className="text-sm font-medium text-gray-900">{formatBalance(balanceTotal)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Presence</span>
                  <span className="text-sm font-medium text-gray-900">{formatBalance(proofOfPresence)}</span>
                </div>
              </div>
            </div>

            {/* Voting Weight */}
            {isWalletReady && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{t('governance_voting_weight_label')}</span>
                  <span className="text-lg font-bold text-blue-600">{votingWeight.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('governance_voting_weight_formula')}
                </p>
              </div>
            )}

            {/* Citizen Status */}
            {!isCitizen() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>{t('governance_note')}:</strong> {t('governance_need_citizen_to_vote')}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>{t('governance_error')}:</strong> {error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletAndVoting;
