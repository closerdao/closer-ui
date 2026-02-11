import React, { useContext } from 'react';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
import { WalletState } from 'closer/contexts/wallet';
import { useTranslations } from 'next-intl';

interface VotingWeightProps {
  className?: string;
}

const VotingWeight: React.FC<VotingWeightProps> = ({ className }) => {
  const { isWalletReady } = useContext(WalletState);
  const { votingWeight, components } = useVotingWeight();
  const t = useTranslations();
  
  const { presence: presenceValue } = components;
  const totalVotingWeight = votingWeight;
  
  if (!isWalletReady) {
    return (
      <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
        <h2 className="text-xl font-bold mb-4">
          {t('governance_voting_weight_label')}
        </h2>
        <p className="text-gray-500">
          {t('governance_connect_wallet_to_see_voting_weight')}
        </p>
      </div>
    );
  }
  
  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <h2 className="text-xl font-bold mb-4">
        {t('governance_voting_weight_label')}
      </h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('governance_presence')}</span>
          <span className="font-medium">{presenceValue.toFixed(2)}</span>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold">{t('governance_total_voting_weight')}</span>
            <span className="font-bold text-lg">{totalVotingWeight.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>{t('governance_voting_weight_formula')}</p>
      </div>
    </div>
  );
};

export default VotingWeight;
