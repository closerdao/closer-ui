import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useMemo, useRef } from 'react';

import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { useTranslations } from 'next-intl';

interface ProposalListProps {
  className?: string;
}

const ProposalList: React.FC<ProposalListProps> = ({ className }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  const t = useTranslations();
  const hasLoaded = useRef(false);

  // Get filter from URL query params
  const filter = (router.query.filter as string) || 'all';
  const shouldRefetch = router.query.refetch === 'true';

  const query = useMemo(() => ({}), []);

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
  }, [platform?.proposal, query, shouldRefetch]);

  // Reload when user changes (for "yours" view freshness)
  useEffect(() => {
    if (platform?.proposal && user?._id) {
      platform.proposal.get(query);
    }
  }, [platform?.proposal, query, user?._id]);

  // Handle refetch parameter
  useEffect(() => {
    if (shouldRefetch && platform?.proposal) {
      platform.proposal.get(query);

      // Clear refetch parameter from URL after triggering refetch
      const { refetch: _refetch, ...queryWithoutRefetch } = router.query;
      router.replace(
        {
          pathname: router.pathname,
          query: queryWithoutRefetch,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [query, router, shouldRefetch, platform?.proposal]);

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

  // Get effective status for display (draft > active > passed/failed)
  const getEffectiveStatus = (proposal: any): {
    status: 'draft' | 'active' | 'passed' | 'failed';
    displayText: string;
  } => {
    const currentStatus = proposal.get('status');
    const endDate = proposal.get('endDate');

    // If draft, always show draft
    if (currentStatus === 'draft') {
      return { status: 'draft', displayText: t('governance_status_draft') };
    }

    // If already passed or rejected, show that
    if (currentStatus === 'passed') {
      return { status: 'passed', displayText: t('governance_status_passed') };
    }
    if (currentStatus === 'rejected') {
      return { status: 'failed', displayText: t('governance_status_failed') };
    }

    // If active, check if voting has ended
    if (currentStatus === 'active') {
      const now = new Date();
      const end = endDate ? new Date(endDate) : null;

      // If no end date or voting hasn't ended, show active
      if (!end || end.getTime() > now.getTime()) {
        return { status: 'active', displayText: t('governance_status_active') };
      }

      // Voting has ended, determine if passed or failed
      const results = proposal.get('results');
      const votes = proposal.get('votes');

      let voteCounts = { yes: 0, no: 0, abstain: 0 };

      if (results !== undefined && results !== null) {
        const resultsObj = results.toJS ? results.toJS() : results;
        voteCounts = Object.assign(
          { yes: 0, no: 0, abstain: 0 },
          resultsObj,
        );
      } else if (votes) {
        const votesObj = votes.toJS ? votes.toJS() : votes;
        if (Array.isArray(votesObj.yes)) {
          voteCounts.yes = votesObj.yes.reduce(
            (sum: number, vote: any) => sum + (vote.weight || 0),
            0,
          );
        } else {
          voteCounts.yes = votesObj.yes || 0;
        }

        if (Array.isArray(votesObj.no)) {
          voteCounts.no = votesObj.no.reduce(
            (sum: number, vote: any) => sum + (vote.weight || 0),
            0,
          );
        } else {
          voteCounts.no = votesObj.no || 0;
        }
      }

      // Passed if yes > no, failed otherwise
      if (voteCounts.yes > voteCounts.no) {
        return { status: 'passed', displayText: t('governance_status_passed') };
      } else {
        return { status: 'failed', displayText: t('governance_status_failed') };
      }
    }

    // Default fallback
    return { status: 'draft', displayText: currentStatus?.toUpperCase() || t('governance_status_unknown') };
  };

  const proposalItems = Array.from(proposalsMap.values()).filter(
    (proposal: any) => {
      if (!proposal?.get || !proposal.get('_id')) return false;

      if (filter === 'yours') {
        return proposal.get('createdBy') === user?._id;
      }

      if (filter === 'active') {
        return getEffectiveStatus(proposal).status === 'active';
      }

      if (filter === 'closed') {
        const status = getEffectiveStatus(proposal).status;
        return status === 'passed' || status === 'failed';
      }

      return true;
    },
  );

  const activeProposalsCount = proposalItems.filter(
    (proposal: any) => getEffectiveStatus(proposal).status === 'active',
  ).length;

  const displayedProposals =
    filter === 'all'
      ? [...proposalItems].sort((a: any, b: any) => {
          const aIsActive = getEffectiveStatus(a).status === 'active';
          const bIsActive = getEffectiveStatus(b).status === 'active';
          if (aIsActive === bIsActive) return 0;
          return aIsActive ? -1 : 1;
        })
      : proposalItems;

  // Get status color classes
  const getStatusColor = (status: 'draft' | 'active' | 'passed' | 'failed'): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      case 'active':
        return 'bg-gray-900 text-white';
      case 'passed':
        return 'bg-gray-200 text-gray-800';
      case 'failed':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Round to 2 decimal places
  const roundToTwoDecimals = (value: number): number => {
    return parseFloat(value.toFixed(2));
  };

  // Check if platform context is available
  if (!platform?.proposal || !platform?.user) {
    return (
      <div className={`rounded-2xl border border-gray-200 bg-white p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">
            {t('governance_platform_not_available')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 ${className}`}>
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            {t('governance_proposals')}
          </h2>
          <p className="text-sm text-gray-500">
            {proposalItems.length} total • {activeProposalsCount} {t('governance_active').toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          <button
            onClick={() => handleFilterChange('all')}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
              filter === 'all'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('governance_all')}
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
              filter === 'active'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('governance_active')}
          </button>
          <button
            onClick={() => handleFilterChange('closed')}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
              filter === 'closed'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('governance_closed')}
          </button>
          <button
            onClick={() => handleFilterChange('yours')}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
              filter === 'yours'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
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
      ) : proposalItems.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">{t('governance_no_proposals_found')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedProposals.map((proposal: any) => {
            // Ensure we have the required fields
            if (!proposal.get('_id')) {
              return null;
            }

            const effectiveStatus = getEffectiveStatus(proposal);
            const endDate = proposal.get('endDate');
            const isVotingEnded = endDate && new Date(endDate).getTime() <= new Date().getTime();
            const isOpen = effectiveStatus.status === 'active';

            return (
              <Link
                key={proposal.get('_id')}
                href={
                  proposal.get('slug')
                    ? `/governance/${proposal.get('slug')}`
                    : `/governance/${proposal.get('_id')}`
                }
                className={`block rounded-xl border p-4 transition ${
                  isOpen
                    ? 'border-gray-900 bg-white shadow-sm'
                    : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50'
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="flex-1 pr-2 text-lg font-medium text-gray-900">
                    {proposal.get('title') || t('governance_untitled_proposal')}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                      effectiveStatus.status,
                    )}`}
                  >
                    {effectiveStatus.displayText}
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-500">
                  {t('governance_submitted_by')} @
                  {getUserScreenname(proposal.get('createdBy'))} •
                  {effectiveStatus.status === 'active' && endDate && !isVotingEnded
                    ? ` ${t('governance_closes_in')} ${getTimeLeft(endDate)}`
                    : effectiveStatus.status === 'passed'
                    ? ` ${t('governance_passed_status')}`
                    : effectiveStatus.status === 'failed'
                    ? ` ${t('governance_failed_status')}`
                    : ''}
                </p>

                <div className="flex items-center justify-between">
                  {(() => {
                    const proposalStatus = proposal.get('status');
                    if (proposalStatus === 'draft') {
                      return (
                        <div className="text-sm font-medium text-gray-500">
                          {t('governance_draft_proposal')}
                        </div>
                      );
                    }

                    const results = proposal.get('results');
                    const votes = proposal.get('votes');

                    let voteCounts = { yes: 0, no: 0, abstain: 0 };

                    if (results !== undefined && results !== null) {
                      const resultsObj = results.toJS ? results.toJS() : results;
                      voteCounts = Object.assign(
                        { yes: 0, no: 0, abstain: 0 },
                        resultsObj,
                      );
                    } else if (votes) {
                      const votesObj = votes.toJS ? votes.toJS() : votes;
                      if (Array.isArray(votesObj.yes)) {
                        voteCounts.yes = votesObj.yes.reduce(
                          (sum: number, vote: any) => sum + (vote.weight || 0),
                          0,
                        );
                      } else {
                        voteCounts.yes = votesObj.yes || 0;
                      }

                      if (Array.isArray(votesObj.no)) {
                        voteCounts.no = votesObj.no.reduce(
                          (sum: number, vote: any) => sum + (vote.weight || 0),
                          0,
                        );
                      } else {
                        voteCounts.no = votesObj.no || 0;
                      }

                      if (Array.isArray(votesObj.abstain)) {
                        voteCounts.abstain = votesObj.abstain.reduce(
                          (sum: number, vote: any) => sum + (vote.weight || 0),
                          0,
                        );
                      } else {
                        voteCounts.abstain = votesObj.abstain || 0;
                      }
                    }

                    const totalVotes =
                      voteCounts.yes + voteCounts.no + voteCounts.abstain;

                    if (totalVotes > 0) {
                      return (
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              {t('governance_yes')}:{' '}
                              {roundToTwoDecimals(voteCounts.yes)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              {t('governance_no')}:{' '}
                              {roundToTwoDecimals(voteCounts.no)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              {t('governance_abstain')}:{' '}
                              {roundToTwoDecimals(voteCounts.abstain)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="text-sm text-gray-500">
                        {t('governance_no_votes_yet')}
                      </div>
                    );
                  })()}

                  {effectiveStatus.status === 'active' && (
                    <span className="rounded-full bg-gray-900 px-3 py-1 text-sm font-medium text-white">
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
