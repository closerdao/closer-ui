import React, { useContext } from 'react';

import { useAuth } from 'closer/contexts/auth';
import { WalletState } from 'closer/contexts/wallet';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
import { useTranslations } from 'next-intl';

import Wallet from '../Wallet';

interface WalletAndVotingProps {
  className?: string;
}

const WalletAndVoting: React.FC<WalletAndVotingProps> = ({ className }) => {
  const { isWalletReady } = useContext(WalletState);
  const { user } = useAuth();
  const { votingWeight } = useVotingWeight();
  const t = useTranslations();

  const isCitizen = (): boolean => {
    return user?.roles?.includes('member') || false;
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <Wallet />

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

      {!isCitizen() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>{t('governance_note')}:</strong>{' '}
            {t('governance_need_citizen_to_vote')}
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletAndVoting;
