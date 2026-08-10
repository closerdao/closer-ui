import React, { useContext, useState } from 'react';

import { useAuth } from 'closer/contexts/auth';
import { WalletDispatch, WalletState } from 'closer/contexts/wallet';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
import { Proposal } from 'closer/types';
import { parseMessageFromError } from 'closer/utils/common';
import { useTranslations } from 'next-intl';

interface VoteModalProps {
  proposal: Proposal | null;
  onClose: () => void;
  onVote: (
    proposalId: string,
    vote: 'yes' | 'no' | 'abstain',
  ) => Promise<boolean>;
}

const VoteModal: React.FC<VoteModalProps> = ({ proposal, onClose, onVote }) => {
  const { isWalletReady, account } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);
  const { user } = useAuth();
  const { votingWeight } = useVotingWeight();
  const t = useTranslations();

  const [selectedVote, setSelectedVote] = useState<
    'yes' | 'no' | 'abstain' | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCitizen = (): boolean => {
    // Check if user has the "member" role (citizens in this system)
    return user?.roles?.includes('member') || false;
  };

  const handleVote = async () => {
    if (!proposal || !selectedVote || !isWalletReady || !account) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // In a real implementation, this would sign a message with the wallet
      // and submit the vote to Snapshot or a similar platform
      const message = `I am voting ${selectedVote} on proposal ${proposal._id}`;
      const signature = await signMessage(message, account);

      if (!signature) {
        throw new Error(t('governance_failed_sign_vote'));
      }

      const success = await onVote(proposal._id, selectedVote);

      if (success) {
        onClose();
      } else {
        throw new Error(t('governance_failed_submit_vote'));
      }
    } catch (err: any) {
      console.error('Vote submission error:', err);
      console.error('Error response data:', err?.response?.data);

      // Handle specific backend error cases
      const errorData = err?.response?.data;
      const statusCode = err?.response?.status;

      // Check for string error messages first
      if (typeof errorData === 'string') {
        switch (errorData) {
          case 'missing_signature_or_vote':
            setError(t('governance_error_missing_fields'));
            break;
          case 'invalid_vote':
            setError(t('governance_error_invalid_vote'));
            break;
          case 'proposal_not_active_for_voting':
            setError(t('governance_error_proposal_not_active'));
            break;
          case 'voting_period_not_active':
            setError(t('governance_error_voting_period_inactive'));
            break;
          case 'user_already_voted':
            setError(t('governance_error_already_voted'));
            break;
          default:
            setError(parseMessageFromError(err));
        }
      }
      // Check for object with error property
      else if (errorData?.error) {
        switch (errorData.error) {
          case 'missing_signature_or_vote':
            setError(t('governance_error_missing_fields'));
            break;
          case 'invalid_vote':
            setError(t('governance_error_invalid_vote'));
            break;
          case 'proposal_not_active_for_voting':
            setError(t('governance_error_proposal_not_active'));
            break;
          case 'voting_period_not_active':
            setError(t('governance_error_voting_period_inactive'));
            break;
          case 'user_already_voted':
            setError(t('governance_error_already_voted'));
            break;
          case 'Proposal not found':
            setError(t('governance_error_proposal_not_found'));
            break;
          case 'User not found':
            setError(t('governance_error_user_not_found'));
            break;
          default:
            setError(parseMessageFromError(err));
        }
      }
      // Check for 401 status code
      else if (statusCode === 401) {
        setError(t('governance_error_unauthorized'));
      }
      // Fallback to generic error parsing
      else {
        setError(parseMessageFromError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!proposal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {t('governance_vote_on_proposal')}
          </h2>
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

          <div className="p-3 bg-accent-light rounded-md mb-4">
            <p className="text-sm font-medium">
              {t('governance_voting_weight', {
                weight: votingWeight.toFixed(2),
              })}
            </p>
          </div>

          {!isCitizen() && (
            <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
              <p className="text-sm">
                <strong>{t('governance_warning')}:</strong>{' '}
                {t('governance_need_citizen_to_vote')}
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
              {t('governance_yes')}
            </button>
            <button
              onClick={() => setSelectedVote('no')}
              className={`w-full py-2 px-4 rounded-md text-left ${
                selectedVote === 'no'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t('governance_no')}
            </button>
            <button
              onClick={() => setSelectedVote('abstain')}
              className={`w-full py-2 px-4 rounded-md text-left ${
                selectedVote === 'abstain'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t('governance_abstain')}
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
              {t('governance_cancel')}
            </button>
            <button
              onClick={handleVote}
              disabled={!selectedVote || isSubmitting || !isWalletReady}
              className={`py-2 px-4 rounded-md ${
                !selectedVote || isSubmitting || !isWalletReady
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-dark text-white'
              }`}
            >
              {isSubmitting
                ? t('governance_submitting')
                : t('governance_submit_vote')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteModal;
