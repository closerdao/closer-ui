import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useContext, useEffect, useRef } from 'react';

import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { WalletState } from 'closer/contexts/wallet';
import { useTranslations } from 'next-intl';

interface ProposalListProps {
  className?: string;
}

const ProposalList: React.FC<ProposalListProps> = ({ className }) => {
  const router = useRouter();
  const { isWalletReady, account } = useContext(WalletState);
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  const t = useTranslations();
  const hasLoaded = useRef(false);

  // Get filter from URL query params
  const filter = (router.query.filter as string) || 'all';
  const shouldRefetch = router.query.refetch === 'true';

  // Build query based on filter
  const getQuery = () => {
    switch (filter) {
      case 'active':
        return { where: { status: 'active' } };
      case 'closed':
        return { where: { status: 'closed' } };
      case 'yours':
        return { where: { createdBy: user?._id } };
      default:
        return {};
    }
  };

  const query = getQuery();

  // Fetch proposals from platform context using immutable structures
  const proposalsMap = platform.proposal.find(query) || new Map();
  const isLoading = platform.proposal.areLoading(query);

  // Load proposals when component mounts or filter changes
  useEffect(() => {
    if ((!hasLoaded.current || shouldRefetch) && platform?.proposal) {
      hasLoaded.current = true;
      try {
        platform.proposal.get(query);
      } catch (error) {
        // Silently handle error - proposals will show as empty
      }
    }
  }, [platform, query, shouldRefetch]);

  // Reload when filter changes
  useEffect(() => {
    if (platform?.proposal && filter !== 'all') {
      platform.proposal.get(query);
    }
  }, [filter, user?._id]);

  // Handle refetch parameter
  useEffect(() => {
    if (shouldRefetch && platform?.proposal) {
      console.log('ProposalList: Triggering refetch with query:', query);
      // Force a fresh fetch by using a unique query key
      const refetchQuery = { ...query, _refetch: Date.now() };
      platform.proposal.get(refetchQuery);

      // Clear refetch parameter from URL after triggering refetch
      const { refetch, ...queryWithoutRefetch } = router.query;
      router.replace(
        {
          pathname: router.pathname,
          query: queryWithoutRefetch,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [shouldRefetch, platform?.proposal, query]);

  // Load users after proposals are loaded
  useEffect(() => {
    if (proposalsMap.size > 0 && platform?.user) {
      try {
        // Get unique user IDs from proposals
        const userIds = Array.from(proposalsMap.values())
          .map((proposal: any) => proposal.get('createdBy'))
          .filter((id: string) => id);

        // Fetch each user individually using getOne to ensure they're stored in byId cache
        userIds.forEach((userId: string) => {
          if (userId && !platform.user.findOne(userId)) {
            platform.user.getOne(userId);
          }
        });
      } catch (error) {
        // Silently handle error - users will show as anonymous
      }
    }
  }, [proposalsMap, platform?.user]);

  // Get user screenname by createdBy ID using platform.user.findOne
  const getUserScreenname = (createdBy: string): string => {
    if (!createdBy) return t('governance_anonymous');
    const user = platform.user.findOne(createdBy);

    if (!user) return t('governance_anonymous');

    // Handle both Map and plain object structures
    const screenname = user.get ? user.get('screenname') : user.screenname;
    const email = user.get ? user.get('email') : user.email;

    return screenname || email || t('governance_anonymous');
  };

  // Handle filter change
  const handleFilterChange = (newFilter: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, filter: newFilter },
      },
      undefined,
      { shallow: true },
    );
  };

  // Calculate time left for active proposals
  const getTimeLeft = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return t('governance_ended');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  // Check if platform context is available
  if (!platform?.proposal || !platform?.user) {
    return (
      <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">
            {t('governance_platform_not_available')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {t('governance_proposals')} ({proposalsMap.size})
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {t('governance_all')}
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {t('governance_active')}
          </button>
          <button
            onClick={() => handleFilterChange('closed')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'closed' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {t('governance_closed')}
          </button>
          <button
            onClick={() => handleFilterChange('yours')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'yours' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {t('governance_yours')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>{t('governance_loading_proposals')}</p>
        </div>
      ) : proposalsMap.size === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">{t('governance_no_proposals_found')}</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>{t('governance_debug_info')}</p>
            <p>
              {t('governance_platform_available')}:{' '}
              {platform?.proposal ? t('common_yes') : t('common_no')}
            </p>
            <p>
              {t('governance_is_loading')}:{' '}
              {isLoading ? t('common_yes') : t('common_no')}
            </p>
            <p>
              {t('governance_proposals_count')}: {proposalsMap.size}
            </p>
            <p>
              {t('governance_query')}: {JSON.stringify(query)}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(proposalsMap.values()).map((proposal: any) => {
            // Ensure we have the required fields
            if (!proposal.get('_id')) {
              return null;
            }

            return (
              <Link
                key={proposal.get('_id')}
                href={
                  proposal.get('slug')
                    ? `/governance/${proposal.get('slug')}`
                    : `/governance/${proposal.get('_id')}`
                }
                className="block p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold flex-1 pr-4">
                    {proposal.get('title') || t('governance_untitled_proposal')}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      proposal.get('status') === 'active'
                        ? 'bg-green-100 text-green-800'
                        : proposal.get('status') === 'closed'
                        ? 'bg-gray-100 text-gray-800'
                        : proposal.get('status') === 'draft'
                        ? 'bg-blue-100 text-blue-800'
                        : proposal.get('status') === 'ready'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {proposal.get('status')?.toUpperCase() ||
                      t('governance_unknown_status')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {t('governance_submitted_by')} @
                  {getUserScreenname(proposal.get('createdBy'))} •
                  {proposal.get('status') === 'active' &&
                  proposal.get('endDate')
                    ? ` ${t('governance_closes_in')} ${getTimeLeft(
                        proposal.get('endDate'),
                      )}`
                    : proposal.get('status') === 'closed'
                    ? ` ${t('governance_closed_status')}`
                    : ''}
                </p>

                <div className="flex justify-between items-center">
                  {proposal.get('status') !== 'draft' &&
                  proposal.get('votes') ? (
                    <div className="flex space-x-4">
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">
                          {t('governance_yes')}: {proposal.get('votes').yes}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-red-600 font-medium">
                          {t('governance_no')}: {proposal.get('votes').no}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">
                          {t('governance_abstain')}:{' '}
                          {proposal.get('votes').abstain}
                        </span>
                      </div>
                    </div>
                  ) : proposal.get('status') !== 'draft' ? (
                    <div className="text-sm text-gray-500">
                      {t('governance_no_votes_yet')}
                    </div>
                  ) : (
                    <div className="text-sm text-blue-600 font-medium">
                      {t('governance_draft_proposal')}
                    </div>
                  )}

                  {proposal.get('status') === 'active' && (
                    <span className="bg-blue-600 text-white text-sm py-1 px-3 rounded">
                      {t('governance_vote')}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProposalList;
