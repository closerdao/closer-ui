import React, { useContext } from 'react';

import { useAuth } from 'closer/contexts/auth';
import { WalletDispatch, WalletState } from 'closer/contexts/wallet';
import { usePresenceToken } from 'closer/hooks/usePresenceToken';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
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
    error,
  } = useContext(WalletState);

  const { user } = useAuth();
  const { connectWallet } = useContext(WalletDispatch);
  const { presenceBalance } = usePresenceToken();
  const { votingWeight } = useVotingWeight();
  const t = useTranslations();

  const isCitizen = (): boolean => {
    return user?.roles?.includes('member') || false;
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4,
    )}`;
  };

  const formatBalance = (balance: string | number | undefined): string => {
    if (typeof balance === 'number') return balance.toFixed(2);
    return parseFloat(balance || '0').toFixed(2);
  };

  const getNetworkStatus = () => {
    if (!isWalletConnected)
      return {
        status: 'disconnected',
        message: t('governance_wallet_not_connected'),
      };
    if (!isCorrectNetwork)
      return {
        status: 'wrong-network',
        message: t('governance_wrong_network'),
      };
    if (!hasSameConnectedAccount)
      return {
        status: 'wrong-account',
        message: t('governance_account_mismatch'),
      };
    return { status: 'connected', message: t('governance_connected') };
  };

  const networkStatus = getNetworkStatus();

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white ${className}`}
    >
      <div className="p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          {t('governance_wallet_voting_power')}
        </h2>

        {!isWalletConnected ? (
          <div className="text-center">
            <button
              onClick={connectWallet}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white transition-colors hover:bg-black"
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
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  {t('governance_wallet_status')}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    networkStatus.status === 'connected'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {networkStatus.status === 'connected'
                    ? t('governance_connected')
                    : networkStatus.message}
                </span>
              </div>

              <div className="text-sm">
                <span className="text-gray-600">
                  {t('governance_address')}:{' '}
                </span>
                <span className="font-mono text-gray-900">
                  {formatAddress(account || '')}
                </span>
              </div>
            </div>

            {/* Token Balances - Only relevant ones */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {t('governance_token_balances')}
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {t('governance_tdf_balance')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatBalance(balanceTotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {t('governance_presence')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatBalance(presenceBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Voting Weight */}
            {isWalletReady && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {t('governance_voting_weight_label')}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {votingWeight.toFixed(2)}
                  </span>
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
                  <strong>{t('governance_note')}:</strong>{' '}
                  {t('governance_need_citizen_to_vote')}
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
