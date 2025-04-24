import React, { useState, useEffect, useContext } from 'react';
import { WalletState } from 'closer/contexts/wallet';

interface Vote {
  id: string;
  proposalId: string;
  proposalTitle: string;
  vote: 'yes' | 'no' | 'abstain';
  timestamp: Date;
  weight: number;
  implemented: boolean;
  implementationLink?: string;
}

interface PastVotesProps {
  className?: string;
}

const PastVotes: React.FC<PastVotesProps> = ({ className }) => {
  const { isWalletReady, account } = useContext(WalletState);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch past votes (mock implementation)
  useEffect(() => {
    const fetchVotes = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from an API or blockchain
        // For now, we'll just use mock data
        if (isWalletReady && account) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const mockVotes: Vote[] = [
            {
              id: '1',
              proposalId: '2',
              proposalTitle: 'Community Kitchen Upgrade',
              vote: 'yes',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
              weight: 12.5,
              implemented: true,
              implementationLink: 'https://example.com/kitchen-upgrade',
            },
            {
              id: '2',
              proposalId: '1',
              proposalTitle: 'New Agroforest',
              vote: 'no',
              timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
              weight: 10.2,
              implemented: false,
            },
            {
              id: '3',
              proposalId: '3',
              proposalTitle: 'Solar Panel Installation',
              vote: 'abstain',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              weight: 12.8,
              implemented: false,
            },
          ];
          
          setVotes(mockVotes);
        } else {
          setVotes([]);
        }
      } catch (error) {
        console.error('Error fetching past votes:', error);
        setVotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotes();
  }, [isWalletReady, account]);

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get vote badge color
  const getVoteBadgeColor = (vote: 'yes' | 'no' | 'abstain'): string => {
    switch (vote) {
      case 'yes':
        return 'bg-green-100 text-green-800';
      case 'no':
        return 'bg-red-100 text-red-800';
      case 'abstain':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <h2 className="text-xl font-bold mb-4">Past Votes</h2>
      
      {!isWalletReady ? (
        <p className="text-gray-500">Connect your wallet to see your past votes</p>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading past votes...</p>
        </div>
      ) : votes.length === 0 ? (
        <p className="text-gray-500">No past votes found</p>
      ) : (
        <div className="space-y-4">
          {votes.map((vote) => (
            <div key={vote.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{vote.proposalTitle}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getVoteBadgeColor(vote.vote)}`}>
                  {vote.vote.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Voted on {formatDate(vote.timestamp)}</span>
                <span>Weight: {vote.weight.toFixed(2)}</span>
              </div>
              
              {vote.implemented && (
                <div className="mt-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    Implemented
                  </span>
                  {vote.implementationLink && (
                    <a
                      href={vote.implementationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      View details
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastVotes;
