import React, { useState, useContext } from 'react';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';
import { Proposal } from './ProposalList';
import { useVotingWeight } from '../../hooks/useVotingWeight';

interface VoteModalProps {
  proposal: Proposal | null;
  onClose: () => void;
  onVote: (proposalId: string, vote: 'yes' | 'no' | 'abstain') => Promise<boolean>;
}

const VoteModal: React.FC<VoteModalProps> = ({ proposal, onClose, onVote }) => {
  const { isWalletReady, account } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);
  const { user } = useAuth();
  const { votingWeight } = useVotingWeight();
  
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | 'abstain' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isCitizen = (): boolean => {
    // Check if user has the "citizen" role
    return user?.roles?.includes('citizen') || false;
  };
  
  const handleVote = async () => {
    if (!proposal || !selectedVote || !isWalletReady || !account) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real implementation, this would sign a message with the wallet
      // and submit the vote to Snapshot or a similar platform
      const message = `I am voting ${selectedVote} on proposal ${proposal.id}`;
      const signature = await signMessage(message, account);
      
      if (!signature) {
        throw new Error('Failed to sign vote message');
      }
      
      const success = await onVote(proposal.id, selectedVote);
      
      if (success) {
        onClose();
      } else {
        throw new Error('Failed to submit vote');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!proposal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Vote on Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{proposal.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{proposal.description}</p>
          
          <div className="p-3 bg-blue-50 rounded-md mb-4">
            <p className="text-sm font-medium">You have {votingWeight.toFixed(2)} voting weight</p>
          </div>
          
          {!isCitizen() && (
            <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
              <p className="text-sm">
                <strong>Warning:</strong> You need to be a Citizen to vote on proposals.
                Your vote may not be counted.
              </p>
            </div>
          )}
          
          <div className="space-y-2 mb-4">
            <button
              onClick={() => setSelectedVote('yes')}
              className={`w-full py-2 px-4 rounded-md text-left ${
                selectedVote === 'yes'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setSelectedVote('no')}
              className={`w-full py-2 px-4 rounded-md text-left ${
                selectedVote === 'no'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              No
            </button>
            <button
              onClick={() => setSelectedVote('abstain')}
              className={`w-full py-2 px-4 rounded-md text-left ${
                selectedVote === 'abstain'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Abstain
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="py-2 px-4 border rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleVote}
              disabled={!selectedVote || isSubmitting || !isWalletReady}
              className={`py-2 px-4 rounded-md ${
                !selectedVote || isSubmitting || !isWalletReady
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
