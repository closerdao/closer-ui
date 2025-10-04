import React, { useState, useContext } from 'react';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { createProposalSignatureHash } from 'closer/utils/crypto';
import { api } from 'closer';

interface CreateProposalProps {
  onClose: () => void;
  onSubmit: (proposal: {
    title: string;
    description: string;
    duration: number;
  }) => Promise<boolean>;
}

const CreateProposal: React.FC<CreateProposalProps> = ({ onClose, onSubmit }) => {
  const { isWalletReady, account } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  
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
      setError('Wallet not connected');
      return;
    }
    
    if (!isCitizen()) {
      setError('Only Citizens can create proposals');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Description is required');
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
        throw new Error('Failed to sign proposal description');
      }

      // Validate required fields before sending
      if (!account) {
        throw new Error('Wallet address is required');
      }
      
      if (!authorSignature) {
        throw new Error('Author signature is required');
      }

      // Create proposal data
      const proposalData = {
        title: title.trim(),
        description: description.trim(),
        authorAddress: account,
        authorSignature: authorSignature,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
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
        signatureHash: descriptionHash,
      };

      // Debug: Log the proposal data being sent
      console.log('Proposal data being sent:', proposalData);

      // Submit proposal to platform context
      try {
        const result = await platform.proposal.post(proposalData);
        console.log('Proposal creation result:', result);
        onClose();
      } catch (platformError) {
        console.warn('Platform context failed, trying direct API call:', platformError);
        // Fallback to direct API call
        const result = await api.post('/proposal', proposalData);
        console.log('Direct API call result:', result);
        onClose();
      }
    } catch (err) {
      console.error('Proposal creation error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {!isWalletReady ? (
          <div className="p-4 bg-accent-light text-accent-dark rounded-md">
            <p>Please connect your wallet to create a proposal.</p>
          </div>
        ) : !isCitizen() ? (
          <div className="p-4 bg-accent-light text-accent-dark rounded-md">
            <p>
              Only Citizens can create proposals. Please contact the DAO
              administrators for more information.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter proposal title"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={5}
                placeholder="Enter proposal description"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (days)
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
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
                Cancel
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
                {isSubmitting ? 'Submitting...' : 'Create Proposal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateProposal;
