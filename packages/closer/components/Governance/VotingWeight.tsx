import React from 'react';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
import { useContext } from 'react';
import { WalletState } from 'closer/contexts/wallet';

interface VotingWeightProps {
  className?: string;
}

const VotingWeight: React.FC<VotingWeightProps> = ({ className }) => {
  const { isWalletReady } = useContext(WalletState);
  const { votingWeight, components, formula } = useVotingWeight();
  
  const { tdf: tdfValue, presence: presenceValue, sweat: sweatValue, sweatWeighted } = components;
  const totalVotingWeight = votingWeight;
  
  if (!isWalletReady) {
    return (
      <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
        <h2 className="text-xl font-bold mb-4">Voting Weight</h2>
        <p className="text-gray-500">Connect your wallet to see your voting weight</p>
      </div>
    );
  }
  
  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <h2 className="text-xl font-bold mb-4">Voting Weight</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">$TDF</span>
          <span className="font-medium">{tdfValue.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">$Presence</span>
          <span className="font-medium">{presenceValue.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">$Sweat × 5</span>
          <div className="text-right">
            <span className="font-medium">{sweatValue.toFixed(2)} × 5 = {sweatWeighted.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold">Total Voting Weight</span>
            <span className="font-bold text-lg">{totalVotingWeight.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Voting weight formula: $TDF + $Presence + ($Sweat × 5)</p>
      </div>
    </div>
  );
};

export default VotingWeight;
