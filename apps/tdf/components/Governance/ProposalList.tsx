import React, { useState, useEffect, useContext } from 'react';
import { WalletState } from 'closer/contexts/wallet';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAddress: string;
  status: 'active' | 'closed' | 'pending';
  startDate: Date;
  endDate: Date;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
}

interface ProposalListProps {
  className?: string;
  onSelectProposal: (proposal: Proposal) => void;
}

const ProposalList: React.FC<ProposalListProps> = ({ className, onSelectProposal }) => {
  const { isWalletReady, account } = useContext(WalletState);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'yours'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch proposals (mock implementation)
  useEffect(() => {
    const fetchProposals = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from Snapshot API or IPFS
        // For now, we'll just use mock data
        const mockProposals: Proposal[] = [
          {
            id: '1',
            title: 'New Agroforest',
            description: 'Proposal to create a new agroforest area in the south field.',
            author: 'daisy.eth',
            authorAddress: '0x1234567890123456789012345678901234567890',
            status: 'active',
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            votes: {
              yes: 15,
              no: 5,
              abstain: 2,
            },
          },
          {
            id: '2',
            title: 'Community Kitchen Upgrade',
            description: 'Proposal to upgrade the community kitchen with new equipment.',
            author: 'chef.eth',
            authorAddress: '0x0987654321098765432109876543210987654321',
            status: 'closed',
            startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            votes: {
              yes: 25,
              no: 2,
              abstain: 1,
            },
          },
          {
            id: '3',
            title: 'Solar Panel Installation',
            description: 'Proposal to install additional solar panels on the main building.',
            author: account ? account.substring(0, 8) : 'unknown.eth',
            authorAddress: account || '0x0000000000000000000000000000000000000000',
            status: 'active',
            startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
            votes: {
              yes: 10,
              no: 3,
              abstain: 0,
            },
          },
        ];

        setProposals(mockProposals);
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isWalletReady) {
      fetchProposals();
    }
  }, [isWalletReady, account]);

  // Filter proposals based on selected filter
  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'all') return true;
    if (filter === 'active') return proposal.status === 'active';
    if (filter === 'closed') return proposal.status === 'closed';
    if (filter === 'yours') return proposal.authorAddress === account;
    return true;
  });

  // Calculate time left for active proposals
  const getTimeLeft = (endDate: Date): string => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Proposals</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'closed' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Closed
          </button>
          <button
            onClick={() => setFilter('yours')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'yours' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Yours
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading proposals...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No proposals found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
              onClick={() => onSelectProposal(proposal)}
            >
              <h3 className="text-lg font-semibold">{proposal.title}</h3>
              <p className="text-sm text-gray-500 mb-3">
                Submitted by @{proposal.author} • 
                {proposal.status === 'active' 
                  ? ` Closes in ${getTimeLeft(proposal.endDate)}`
                  : ' Closed'}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">Yes: {proposal.votes.yes}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-red-600 font-medium">No: {proposal.votes.no}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Abstain: {proposal.votes.abstain}</span>
                  </div>
                </div>
                
                {proposal.status === 'active' && (
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProposal(proposal);
                    }}
                  >
                    Vote
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalList;
