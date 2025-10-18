import React, { useContext, useState } from 'react';

import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { WalletDispatch, WalletState } from 'closer/contexts/wallet';
import { createProposalSignatureHash } from 'closer/utils/crypto';
import { useTranslations } from 'next-intl';

interface CreateProposalProps {
  onClose: () => void;
  onSubmit: (proposal: {
    title: string;
    description: string;
    duration: number;
  }) => Promise<boolean>;
}

const CreateProposal: React.FC<CreateProposalProps> = ({
  onClose,
  onSubmit,
}) => {
  const { isWalletReady, account } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  const t = useTranslations();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(7); // Default 7 days
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCitizen = (): boolean => {
    // Check if user has the "member" role (citizens in this system)
    return user?.roles?.includes('member') || false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWalletReady || !account) {
      setError(t('governance_wallet_not_connected'));
      return;
    }

    if (!isCitizen()) {
      setError(t('governance_only_citizens_can_create'));
      return;
    }

    if (!title.trim()) {
      setError(t('governance_title_required'));
      return;
    }

    if (!description.trim()) {
      setError(t('governance_description_required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create proposal description hash
      const descriptionHash = createProposalSignatureHash(description);

      // Sign the proposal description hash for author verification
      const authorSignature = await signMessage(descriptionHash, account);

      if (!authorSignature) {
        throw new Error(t('governance_failed_sign_proposal'));
      }

      // Validate required fields before sending
      if (!account) {
        throw new Error(t('governance_wallet_address_required'));
      }

      if (!authorSignature) {
        throw new Error(t('governance_author_signature_required'));
      }

      // Create proposal data
      const proposalData = {
        title: title.trim(),
        description: description.trim(),
        authorAddress: account,
        authorSignature: authorSignature,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(
          Date.now() + duration * 24 * 60 * 60 * 1000,
        ).toISOString(),
        votes: {
          yes: 0,
          no: 0,
          abstain: 0,
        },
        visibleBy: [],
        createdBy: user?._id || '',
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
        attributes: [],
        managedBy: [],
      };

      // Submit proposal to platform context
      await platform.proposal.post(proposalData);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('governance_unknown_error'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {t('governance_create_proposal')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!isWalletReady ? (
          <div className="p-4 bg-accent-light text-accent-dark rounded-md">
            <p>{t('governance_connect_wallet_to_create')}</p>
          </div>
        ) : !isCitizen() ? (
          <div className="p-4 bg-accent-light text-accent-dark rounded-md">
            <p>{t('governance_contact_dao_administrators')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('governance_title_label')}
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder={t('governance_title_placeholder')}
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('governance_description_label')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={5}
                placeholder={t('governance_description_placeholder')}
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('governance_duration_label')}
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={3}>{t('governance_duration_3_days')}</option>
                <option value={7}>{t('governance_duration_7_days')}</option>
                <option value={14}>{t('governance_duration_14_days')}</option>
                <option value={30}>{t('governance_duration_30_days')}</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border rounded-md"
                disabled={isSubmitting}
              >
                {t('governance_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`py-2 px-4 rounded-md ${
                  isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-accent hover:bg-accent-dark text-white'
                }`}
              >
                {isSubmitting
                  ? t('governance_submitting')
                  : t('governance_create_proposal')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateProposal;
