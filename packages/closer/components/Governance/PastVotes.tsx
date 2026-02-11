import React, { useState, useEffect, useContext } from 'react';
import { WalletState } from 'closer/contexts/wallet';
import { useLocale, useTranslations } from 'next-intl';

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
  const t = useTranslations();
  const locale = useLocale();
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
    return date.toLocaleDateString(locale, {
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
      <h2 className="text-xl font-bold mb-4">{t('governance_past_votes')}</h2>
      
      {!isWalletReady ? (
        <p className="text-gray-500">
          {t('governance_connect_wallet_to_see_past_votes')}
        </p>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>{t('governance_loading_past_votes')}</p>
        </div>
      ) : votes.length === 0 ? (
        <p className="text-gray-500">{t('governance_no_past_votes_found')}</p>
      ) : (
        <div className="space-y-4">
          {votes.map((vote) => (
            <div key={vote.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{vote.proposalTitle}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getVoteBadgeColor(vote.vote)}`}>
                  {t(`governance_${vote.vote}`)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>
                  {t('governance_voted_on', { date: formatDate(vote.timestamp) })}
                </span>
                <span>{t('governance_weight_label', { weight: vote.weight.toFixed(2) })}</span>
              </div>
              
              {vote.implemented && (
                <div className="mt-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {t('governance_implemented')}
                  </span>
                  {vote.implementationLink && (
                    <a
                      href={vote.implementationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      {t('governance_view_details')}
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
