import Head from 'next/head';
import { useRouter } from 'next/router';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { proposalMarkdownComponents } from 'closer/components/display';
import GovernanceConfetti from 'closer/components/Governance/GovernanceConfetti';
import ProposalComments from 'closer/components/Governance/ProposalComments';
import ProposalCountdownTimer from 'closer/components/Governance/ProposalCountdownTimer';
import ProposalResultCelebration from 'closer/components/Governance/ProposalResultCelebration';
import VoteAmountSelector from 'closer/components/Governance/VoteAmountSelector';

import { ErrorMessage, api } from 'closer';
import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { WalletDispatch, WalletState } from 'closer/contexts/wallet';
import { useHasMounted } from 'closer/hooks/useHasMounted';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
import { Proposal, ProposalReward, ProposalVote } from 'closer/types';
import { parseMessageFromError, slugify } from 'closer/utils/common';
import {
  getEffectiveStatus as getProposalEffectiveStatus,
  getVoteCounts,
} from 'closer/utils/proposalStatus';
import {
  createProposalSignatureHash,
  createVoteSignatureHash,
} from 'closer/utils/crypto';
import { getBearerAuthHeaders } from 'closer/utils/authHeaders.helpers';
import { NextApiRequest, NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface ProposalDetailPageProps {
  proposal: Proposal | null;
  proposalCreator: any;
  error?: string;
}

// How often an open proposal re-reads its tally, so votes cast elsewhere
// show up without a reload.
const LIVE_RESULTS_POLL_MS = 30000;

type UserVoteSummary = {
  castWeight: number;
  lastVote: 'yes' | 'no' | 'abstain' | null;
};

// What a user has committed to a proposal. Votes can be cast incrementally, so
// the same user may appear more than once across the three buckets.
const getUserVoteSummary = (
  proposal: Proposal | null | undefined,
  userId: string | undefined,
): UserVoteSummary => {
  const emptySummary: UserVoteSummary = { castWeight: 0, lastVote: null };

  if (!proposal?.votes || !userId) {
    return emptySummary;
  }

  return (['yes', 'no', 'abstain'] as const).reduce((summary, option) => {
    const optionVotes = proposal.votes?.[option] || [];

    return optionVotes
      .filter((vote) => vote.userId === userId)
      .reduce(
        (accumulator, vote) => ({
          castWeight: accumulator.castWeight + (vote.weight || 0),
          lastVote: option,
        }),
        summary,
      );
  }, emptySummary);
};

// The vote endpoint may answer with the updated proposal, with just the vote it
// recorded, or with nothing meaningful. Only the first is useful here.
const proposalFromVoteResponse = (data: any): Proposal | null => {
  const candidate = data?.results || data?.proposal || data;

  return candidate?.votes && candidate?._id ? (candidate as Proposal) : null;
};

const appendVote = (
  proposal: Proposal,
  option: 'yes' | 'no' | 'abstain',
  vote: ProposalVote,
): Proposal => ({
  ...proposal,
  votes: {
    yes: proposal.votes?.yes || [],
    no: proposal.votes?.no || [],
    abstain: proposal.votes?.abstain || [],
    [option]: [...(proposal.votes?.[option] || []), vote],
  },
});

const ProposalDetailPage: NextPage<ProposalDetailPageProps> = ({
  proposal,
  proposalCreator,
  error: propError,
}) => {
  const router = useRouter();
  const { isWalletReady, account } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  const { votingWeight } = useVotingWeight();
  const t = useTranslations();
  const hasMounted = useHasMounted();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Closer';

  const hasLoadedConfig = useRef(false);
  const configLoadError = useRef(false);

  // Load governance config (only once, with error handling)
  useEffect(() => {
    if (!platform?.config || hasLoadedConfig.current || configLoadError.current) {
      return;
    }

    // Check if config already exists in cache
    const existingConfig = platform.config.findOne('governance');
    if (existingConfig) {
      hasLoadedConfig.current = true;
      return;
    }

    // Try to load config, but only once
    hasLoadedConfig.current = true;
    platform.config
      .getOne('governance')
      .catch((error: any) => {
        // If 404 or similar error, mark as failed and don't retry
        if (error?.response?.status === 404 || error?.response?.status >= 400) {
          configLoadError.current = true;
          console.log('Governance config not found, using default quorum percentage');
        } else {
          // For other errors, allow retry by resetting the flag
          hasLoadedConfig.current = false;
        }
      });
  }, [platform?.config]);

  const [selectedVote, setSelectedVote] = useState<
    'yes' | 'no' | 'abstain' | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<'yes' | 'no' | 'abstain' | null>(
    null,
  );
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);
  const [selectedVoteAmount, setSelectedVoteAmount] = useState(0);
  const [isCastingMoreVotes, setIsCastingMoreVotes] = useState(false);
  const [voteConfettiIntensity, setVoteConfettiIntensity] = useState(0.5);
  const [forceResultCelebration, setForceResultCelebration] = useState(false);
  const [error, setError] = useState<string | null>(propError || null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(
    proposal,
  );
  const [editData, setEditData] = useState({
    title: '',
    slug: '',
    description: '',
    rewards: [] as ProposalReward[],
  });
  const [promotionData, setPromotionData] = useState({
    dateStart: '',
    duration: '14', // Default to 14 days (standard)
  });

  const isCitizen = (): boolean => {
    return user?.roles?.includes('member') || false;
  };

  const isAuthor = (): boolean => {
    return user?._id === currentProposal?.createdBy;
  };

  const canEdit = (): boolean => {
    return isAuthor() && currentProposal?.status === 'draft';
  };

  const getAuthorName = (): string => {
    if (proposalCreator?.screenname) {
      return proposalCreator.screenname;
    }

    if (!currentProposal?.createdBy) {
      return currentProposal?.authorAddress || t('governance_anonymous');
    }

    const authorUser = platform.user.findOne(currentProposal.createdBy);
    if (authorUser) {
      const screenname = authorUser.get
        ? authorUser.get('screenname')
        : authorUser.screenname;
      const email = authorUser.get ? authorUser.get('email') : authorUser.email;
      return (
        screenname ||
        email ||
        currentProposal.authorAddress ||
        t('governance_anonymous')
      );
    }

    return currentProposal.authorAddress || t('governance_anonymous');
  };

  useEffect(() => {
    if (currentProposal?.createdBy && platform?.user) {
      const authorUser = platform.user.findOne(currentProposal.createdBy);
      if (!authorUser) {
        platform.user.getOne(currentProposal.createdBy);
      }
    }
  }, [currentProposal?.createdBy, platform?.user]);

  const isTeamMember = (): boolean => {
    return user?.roles?.includes('team') || false;
  };

  const handleAddReward = () => {
    const TREASURY_ADDRESS = '0x5E810b93c51981eccA16e030Ea1cE8D8b1DEB83b';
    const defaultSource = account || (isTeamMember() ? TREASURY_ADDRESS : '');
    setEditData({
      ...editData,
      rewards: [
        ...editData.rewards,
        {
          name: '',
          amount: 0,
          contractAddress: '',
          source: defaultSource,
        },
      ],
    });
  };

  const handleRemoveReward = (index: number) => {
    setEditData({
      ...editData,
      rewards: editData.rewards.filter((_, i) => i !== index),
    });
  };

  const handleRewardChange = (
    index: number,
    field: keyof ProposalReward,
    value: string | number,
  ) => {
    const updatedRewards = [...editData.rewards];
    updatedRewards[index] = {
      ...updatedRewards[index],
      [field]: value,
    };
    setEditData({
      ...editData,
      rewards: updatedRewards,
    });
  };

  // Initialize edit data when proposal loads
  useEffect(() => {
    if (currentProposal && !isEditing) {
      setEditData({
        title: currentProposal.title || '',
        slug: currentProposal.slug || '',
        description: currentProposal.description || '',
        rewards: currentProposal.rewards || [],
      });
    }
  }, [currentProposal, isEditing]);

  // Generate slug from title when editing (same logic as EditModel)
  useEffect(() => {
    if (isEditing && editData.title && editData.title.trim().length > 0) {
      const generatedSlug = slugify(editData.title.trim());
      if (generatedSlug && generatedSlug !== editData.slug) {
        setEditData({ ...editData, slug: generatedSlug });
      }
    }
  }, [editData.title, editData.slug, isEditing]);

  // Helper function to get the most up-to-date proposal data. The polled
  // platform cache is usually ahead of local state, but not while it is still
  // catching up with a vote this session just cast — prefer local state then,
  // so the tally never drops a vote the voter has already been told landed.
  const getCurrentProposalData = () => {
    if (currentProposal?.slug) {
      const platformProposal = platform.proposal.findOne(currentProposal.slug);
      if (platformProposal && platformProposal.toJS) {
        const cached = platformProposal.toJS() as Proposal;

        if (isNotBehindOnOwnVote(cached, currentProposal)) {
          return cached;
        }
      }
    }
    return currentProposal;
  };

  const existingUserVote = useMemo(
    () => getUserVoteSummary(currentProposal, user?._id),
    [currentProposal, user?._id],
  );

  const castVoteWeight = parseFloat(existingUserVote.castWeight.toFixed(2));
  const remainingVoteWeight = Math.max(
    0,
    parseFloat(((votingWeight || 0) - castVoteWeight).toFixed(2)),
  );
  const hasUnspentVotes = remainingVoteWeight > 0;

  // Reflect votes cast in an earlier session, so a reload does not offer the
  // form again for weight that is already spent.
  useEffect(() => {
    if (castVoteWeight > 0) {
      setHasVoted(true);
      setUserVote(existingUserVote.lastVote);
    }
  }, [castVoteWeight, existingUserVote.lastVote]);

  // Same condition as `isActive` below, but computed before the early returns
  // so the polling hook can depend on it.
  const votingEndsAt = currentProposal?.endDate
    ? new Date(currentProposal.endDate).getTime()
    : null;
  const isVotingOpen =
    currentProposal?.status === 'active' &&
    !!votingEndsAt &&
    Date.now() < votingEndsAt;

  const handleCastMoreVotes = () => {
    setSelectedVoteAmount(0);
    setSelectedVote(existingUserVote.lastVote);
    setError(null);
    setIsCastingMoreVotes(true);
  };

  // A read that has not yet caught up with this session's own vote must never
  // replace what we already know — see the vote response handling below.
  const isNotBehindOnOwnVote = (next: Proposal, previous: Proposal | null) =>
    !previous ||
    getUserVoteSummary(next, user?._id).castWeight >=
      getUserVoteSummary(previous, user?._id).castWeight;

  const refreshProposal = useCallback(async () => {
    const slug = currentProposal?.slug;

    if (!slug || !platform?.proposal) {
      return;
    }

    try {
      // `force` matters: getOne otherwise answers from a 5 minute in-memory
      // cache, which would make this poll return the same tally every time.
      const refreshed = await platform.proposal.getOne(slug, { force: true });

      if (!refreshed?.results) {
        return;
      }

      const next = refreshed.results.toJS() as Proposal;

      setCurrentProposal((previous) =>
        isNotBehindOnOwnVote(next, previous) ? next : previous,
      );
    } catch (err) {
      // A dropped poll is not worth putting in front of the voter; the next
      // tick tries again.
      console.error('Proposal refresh failed:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProposal?.slug, platform?.proposal, user?._id]);

  // Poll the tally while voting is open, so votes cast by other members appear
  // without a reload. Paused while the tab is hidden, and caught up as soon as
  // it comes back.
  useEffect(() => {
    if (!isVotingOpen) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshProposal();
      }
    }, LIVE_RESULTS_POLL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshProposal();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVotingOpen, refreshProposal]);

  const handleVote = async () => {
    if (!currentProposal || !selectedVote || !isWalletReady || !account) return;
    if (selectedVoteAmount <= 0) return;

    setIsSubmitting(true);
    setError(null);

    // Create vote signature hash
    const voteSignatureHash = createVoteSignatureHash(
      currentProposal.description,
      selectedVote,
    );

    // In a real implementation, this would sign a message with the wallet
    // and submit the vote to Snapshot or a similar platform
    const message = `I am voting ${selectedVote} on proposal ${currentProposal._id}`;
    const signature = await signMessage(message, account);

    if (!signature) {
      throw new Error(t('governance_failed_sign_vote'));
    }

    // Create vote data with signature hash
    const voteAmount = Math.min(selectedVoteAmount, remainingVoteWeight);
    const voteData = {
      votingWeight: voteAmount,
      signature: voteSignatureHash,
      vote: selectedVote,
    };
    try {
      // Submit vote to platform context
      const voteResponse = await api.post(
        `/proposals/${currentProposal._id}/vote`,
        voteData,
      );

      // The vote we just cast, as it should appear on the proposal.
      const castVote: ProposalVote = {
        userId: user?._id || '',
        signature: voteSignatureHash,
        weight: voteAmount,
        votedAt: new Date().toISOString(),
      };

      // Prefer the proposal the vote endpoint hands back — it is the only
      // response guaranteed to already include this vote. Falling back to a
      // local append keeps the cast/remaining totals correct against backends
      // that return just the vote, or nothing useful at all.
      const votedProposal =
        proposalFromVoteResponse(voteResponse?.data) ||
        appendVote(currentProposal, selectedVote, castVote);

      setCurrentProposal(votedProposal);

      // Update local state
      setHasVoted(true);
      setUserVote(selectedVote);
      setVoteConfettiIntensity(
        Math.min(1, voteAmount / Math.max(votingWeight || 1, 1)),
      );
      setShowVoteSuccess(true);
      setIsCastingMoreVotes(false);
      setSelectedVoteAmount(0);

      // Refresh the proposal data from the platform context
      const refreshedProposal = await platform.proposal.getOne(
        currentProposal.slug,
        { force: true },
      );

      // Only adopt the refreshed copy if it has caught up with the vote we just
      // cast — a read that lands before the write is visible would otherwise
      // roll the totals back to zero until the next page load.
      if (refreshedProposal?.results) {
        const refreshed = refreshedProposal.results.toJS() as Proposal;

        if (isNotBehindOnOwnVote(refreshed, votedProposal)) {
          setCurrentProposal(refreshed);
        }
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      title: currentProposal?.title || '',
      slug: currentProposal?.slug || '',
      description: currentProposal?.description || '',
      rewards: currentProposal?.rewards || [],
    });
  };

  const handleSaveEdit = async () => {
    if (!currentProposal) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedData = {
        ...currentProposal,
        title: editData.title,
        slug: editData.slug,
        description: editData.description,
        rewards: editData.rewards.length > 0 ? editData.rewards : undefined,
        updated: new Date().toISOString(),
      };

      const response = await platform.proposal.patch(
        currentProposal._id,
        updatedData,
      );

      // Update local proposal state with the response data
      if (response?.data?.results) {
        setCurrentProposal(response.data.results);
        setEditData({
          title: response.data.results.title || '',
          slug: response.data.results.slug || '',
          description: response.data.results.description || '',
          rewards: response.data.results.rewards || [],
        });
      } else {
        // Fallback: update local state with the data we sent
        setCurrentProposal(updatedData);
      }

      // Refresh the proposal data from the platform context
      platform.proposal.getOne(currentProposal.slug, { force: true });

      // Also refresh the proposals list to ensure updated data is visible
      platform.proposal.get({});

      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('governance_failed_update_proposal'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveToReady = async () => {
    if (!currentProposal || !isWalletReady || !account) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create proposal description hash
      const descriptionHash = createProposalSignatureHash(editData.description);

      // Sign the proposal description hash for author verification
      const authorSignature = await signMessage(descriptionHash, account);

      if (!authorSignature) {
        throw new Error(t('governance_failed_sign_proposal'));
      }

      const updatedData = {
        ...currentProposal,
        ...editData,
        status: 'active' as const,
        authorAddress: account,
        authorSignature: authorSignature,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
        votes: {
          yes: [],
          no: [],
          abstain: [],
        },
        updated: new Date().toISOString(),
      };

      const response = await platform.proposal.patch(
        currentProposal._id,
        updatedData,
      );

      // Update local state with the response data
      if (response?.data?.results) {
        setCurrentProposal(response.data.results);
        // Update the proposal state with the new data
        // Refresh the proposal data from the platform context
        platform.proposal.getOne(currentProposal.slug, { force: true });
        setEditData({
          title: response.data.results.title || '',
          slug: response.data.results.slug || '',
          description: response.data.results.description || '',
          rewards: response.data.results.rewards || [],
        });
      } else {
        // Fallback: update local state with the data we sent
        setCurrentProposal(updatedData);
      }

      // Also refresh the proposals list to ensure updated data is visible
      platform.proposal.get({});

      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('governance_failed_move_to_ready'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromoteToActive = async () => {
    if (
      !currentProposal ||
      !isWalletReady ||
      !account ||
      !promotionData.dateStart
    )
      return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate end date from start date and duration
      const startDate = new Date(promotionData.dateStart);
      const durationDays = parseInt(promotionData.duration);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);

      // Create proposal description hash for signature
      const descriptionHash = createProposalSignatureHash(
        currentProposal.description,
      );

      // Sign the proposal description hash for author verification
      const authorSignature = await signMessage(descriptionHash, account);

      if (!authorSignature) {
        throw new Error(t('governance_failed_sign_proposal'));
      }

      // Update proposal data to active status
      const updatedData = {
        ...currentProposal,
        ...editData,
        status: 'active' as const,
        authorAddress: account,
        authorSignature: authorSignature,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        votes: {
          yes: [],
          no: [],
          abstain: [],
        },
        updated: new Date().toISOString(),
      };

      // Use platform context to update the proposal
      const response = await platform.proposal.patch(
        currentProposal._id,
        updatedData,
      );

      // Update local proposal state with the response data
      if (response?.data?.results) {
        setCurrentProposal(response.data.results);
      } else {
        // Fallback: update local state with the data we sent
        setCurrentProposal(updatedData);
      }

      // Refresh the proposal data from the platform context
      platform.proposal.getOne(currentProposal.slug, { force: true });

      // Also refresh the proposals list to ensure updated data is visible
      platform.proposal.get({});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('governance_failed_promote_to_active'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatted in the viewer's timezone, which the server cannot know, so the
  // output is held back until mount to keep the SSR markup and the first
  // client render identical. Same reason for getTimeRemaining below and for
  // ProposalCountdownTimer.
  const formatDate = (date: string) => {
    if (!hasMounted) return '';
    if (!date) return t('governance_not_available');
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return t('governance_not_available');
    return new Intl.DateTimeFormat(router.locale || undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const getTimeRemaining = (endDate: string) => {
    if (!hasMounted) return '';
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return t('governance_voting_ended');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return t('governance_days_hours_remaining', { days, hours });
    return t('governance_hours_remaining', { hours });
  };

  const getEffectiveStatus = (proposal: Proposal | null) =>
    getProposalEffectiveStatus(proposal, {
      draft: t('governance_status_draft'),
      active: t('governance_status_active'),
      passed: t('governance_status_passed'),
      failed: t('governance_status_failed'),
      unknown: t('governance_status_unknown'),
    });

  const handleVotingPeriodEnded = async () => {
    if (!currentProposal?.slug) {
      return;
    }

    const refreshedProposal = await platform.proposal.getOne(
      currentProposal.slug,
      { force: true },
    );
    if (refreshedProposal?.results) {
      setCurrentProposal(refreshedProposal.results.toJS());
    }

    setForceResultCelebration(true);
  };

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

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (!currentProposal) {
    return (
      <>
        <Head>
          <title>{`${t('governance_proposal_not_found')} - ${appName}`}</title>
        </Head>
        <div className="min-h-screen bg-gray-50/70">
          <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {t('governance_proposal_not_found')}
            </h1>
            <p className="text-gray-600 mb-8">
              {error || t('governance_proposal_not_found_message')}
            </p>
            <button
              onClick={() => router.push('/governance')}
              className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white transition-colors hover:bg-black"
            >
              {t('governance_back_to_governance')}
            </button>
          </div>
        </div>
        </div>
      </>
    );
  }

  // Get the most up-to-date proposal data for voting results
  const freshProposalData = getCurrentProposalData();
  const voteCounts = getVoteCounts(freshProposalData || currentProposal);
  const totalVotes = voteCounts.yes + voteCounts.no + voteCounts.abstain;
  const quorum = freshProposalData?.quorum || 0;
  const isQuorumReached = quorum > 0 && totalVotes >= quorum;
  const quorumProgress =
    quorum > 0 ? Math.min(100, Math.round((totalVotes / quorum) * 100)) : 0;
  const isActive =
    freshProposalData?.status === 'active' &&
    freshProposalData?.endDate &&
    new Date() < new Date(freshProposalData.endDate);
  const effectiveStatus = getEffectiveStatus(freshProposalData || currentProposal);

  return (
    <>
      <Head>
        <title>{`${currentProposal.title} - ${appName}`}</title>
        <meta
          name="description"
          content={currentProposal.description?.substring(0, 160) || ''}
        />
      </Head>

      <GovernanceConfetti
        active={showVoteSuccess}
        intensity={voteConfettiIntensity}
        variant="celebrate"
        durationMs={2800}
        onComplete={() => setShowVoteSuccess(false)}
      />
      <ProposalResultCelebration
        proposalId={currentProposal._id}
        endDate={
          freshProposalData?.endDate
            ? String(freshProposalData.endDate)
            : currentProposal.endDate
              ? String(currentProposal.endDate)
              : undefined
        }
        effectiveStatus={effectiveStatus.status}
        forceShow={forceResultCelebration}
      />

      <div className="min-h-screen bg-gray-50/70">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/governance?refetch=true')}
            className="mb-4 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {t('governance_back_to_governance')}
          </button>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentProposal.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  {t('governance_by')} {getAuthorName()}
                </span>
                <span>•</span>
                <span>{formatDate(String(currentProposal.created))}</span>
                <span>•</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    getEffectiveStatus(freshProposalData || currentProposal).status,
                  )}`}
                >
                  {getEffectiveStatus(freshProposalData || currentProposal).displayText}
                </span>
              </div>
            </div>
            {canEdit() && (
              <div className="flex space-x-2">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                  >
                    {t('governance_edit')}
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                    >
                      {t('governance_cancel')}
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSubmitting}
                      className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
                    >
                      {t('governance_save')}
                    </button>
                    {isWalletReady && (
                      <button
                        onClick={handleMoveToReady}
                        disabled={isSubmitting}
                        className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
                      >
                        {t('governance_move_to_ready')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isActive && (
            <div className="rounded-xl border border-gray-900 bg-gray-900 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('governance_voting_is_active')}</p>
                  <p className="text-sm text-gray-200">
                    {getTimeRemaining(String(freshProposalData?.endDate || ''))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {totalVotes} {t('governance_votes')}
                  </p>
                  <p className="text-sm text-gray-200">
                    {t('governance_ends')}{' '}
                    {formatDate(String(freshProposalData?.endDate || ''))}
                  </p>
                </div>
              </div>
              {freshProposalData?.endDate && (
                <ProposalCountdownTimer
                  endDate={String(freshProposalData.endDate)}
                  onComplete={handleVotingPeriodEnded}
                />
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Proposal Content */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold mb-4">{t('governance_proposal_content')}</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-title"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('governance_title_label')}
                    </label>
                    <input
                      id="edit-title"
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-slug"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('governance_slug_label')}
                    </label>
                    <input
                      id="edit-slug"
                      type="text"
                      value={editData.slug}
                      onChange={(e) =>
                        setEditData({ ...editData, slug: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      placeholder={t('governance_slug_placeholder')}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {t('governance_slug_help')}
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('governance_content_label')}
                    </label>
                    <textarea
                      id="edit-description"
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      rows={15}
                    />
                  </div>
                </div>
              ) : (
                <div className="markdown">
                  <ReactMarkdown components={proposalMarkdownComponents}>
                    {currentProposal.description}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Voting Section */}
            {isActive && isWalletReady && isCitizen() && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {hasVoted && !isCastingMoreVotes
                    ? t('governance_your_vote')
                    : t('governance_cast_your_vote')}
                </h2>

                {hasVoted && !isCastingMoreVotes ? (
                  <div className="rounded-lg border border-gray-300 bg-gray-100 p-4">
                    <p className="font-medium text-gray-900">
                      {t('governance_you_voted')} <span className="capitalize">{userVote}</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('governance_vote_submitted_with_weight', {
                        weight: castVoteWeight.toFixed(2),
                      })}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('governance_thank_you_participating')}
                    </p>
                    {hasUnspentVotes && (
                      <div className="mt-3 border-t border-gray-300 pt-3">
                        <p className="text-sm text-gray-600">
                          {t('governance_votes_remaining', {
                            remaining: remainingVoteWeight.toFixed(2),
                          })}
                        </p>
                        <button
                          type="button"
                          onClick={handleCastMoreVotes}
                          className="mt-1 text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-black"
                        >
                          {t('governance_cast_more_votes')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <VoteAmountSelector
                        totalWeight={remainingVoteWeight}
                        value={selectedVoteAmount}
                        onChange={setSelectedVoteAmount}
                        alreadyCastWeight={castVoteWeight}
                      />
                    </div>

                    <div className="space-y-3 mb-6">
                      {(['yes', 'no', 'abstain'] as const).map((option) => (
                        <label
                          key={option}
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedVote === option
                              ? 'border-gray-900 bg-gray-100'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="vote"
                            value={option}
                            checked={selectedVote === option}
                            onChange={(e) =>
                              setSelectedVote(
                                e.target.value as 'yes' | 'no' | 'abstain',
                              )
                            }
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">
                                {option}
                              </span>
                              <span className="text-sm text-gray-500">
                                {option === 'yes' && t('governance_support_proposal')}
                                {option === 'no' && t('governance_reject_proposal')}
                                {option === 'abstain' &&
                                  t('governance_neutral_proposal')}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {error && <ErrorMessage error={error} />}

                    <button
                      onClick={handleVote}
                      disabled={
                        !selectedVote || isSubmitting || selectedVoteAmount <= 0
                      }
                      className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {isSubmitting ? t('governance_submitting_vote') : t('governance_submit_vote')}
                    </button>

                    {isCastingMoreVotes && (
                      <button
                        type="button"
                        onClick={() => setIsCastingMoreVotes(false)}
                        className="mt-3 w-full text-sm text-gray-600 underline underline-offset-2 hover:text-gray-900"
                      >
                        {t('governance_cancel')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Voting Requirements */}
            {isActive && (!isWalletReady || !isCitizen()) && (
              <div className="rounded-lg border border-gray-300 bg-gray-100 p-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {t('governance_voting_requirements')}
                </h3>
                <div className="space-y-2 text-gray-700">
                  {!isWalletReady && <p>• {t('governance_connect_wallet_to_vote')}</p>}
                  {!isCitizen() && (
                    <p>• {t('governance_must_be_member')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            <ProposalComments proposal={currentProposal} className="mt-6" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Section */}
            {(() => {
              const rewards = isEditing
                ? editData.rewards
                : freshProposalData?.rewards || currentProposal?.rewards || [];

              if (rewards.length === 0) return null;

              return (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('governance_rewards')}
                    </h3>
                    {canEdit() && isEditing && (
                      <button
                        type="button"
                        onClick={handleAddReward}
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-black"
                      >
                        {t('governance_add_reward')}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {rewards.map((reward: ProposalReward, index: number) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        {isEditing && canEdit() ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-medium text-gray-700">
                                {t('governance_reward')} {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveReward(index)}
                                className="text-xs text-gray-500 hover:text-gray-800"
                              >
                                {t('governance_remove')}
                              </button>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {t('governance_reward_name')} *
                              </label>
                              <input
                                type="text"
                                value={reward.name}
                                onChange={(e) =>
                                  handleRewardChange(index, 'name', e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
                                placeholder={t('governance_reward_name_placeholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {t('governance_reward_amount')} *
                              </label>
                              <input
                                type="number"
                                step="0.000000000000000001"
                                value={reward.amount || ''}
                                onChange={(e) =>
                                  handleRewardChange(
                                    index,
                                    'amount',
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
                                placeholder={t('governance_reward_amount_placeholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {t('governance_reward_contract_address')} *
                              </label>
                              <input
                                type="text"
                                value={reward.contractAddress}
                                onChange={(e) =>
                                  handleRewardChange(
                                    index,
                                    'contractAddress',
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
                                placeholder={t(
                                  'governance_reward_contract_address_placeholder',
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {t('governance_reward_source')} *
                              </label>
                              <select
                                value={reward.source}
                                onChange={(e) =>
                                  handleRewardChange(index, 'source', e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
                              >
                                {isTeamMember() && (
                                  <option value="0x5E810b93c51981eccA16e030Ea1cE8D8b1DEB83b">
                                    {t('governance_treasury')} (0x5E810b93c51981eccA16e030Ea1cE8D8b1DEB83b)
                                  </option>
                                )}
                                {account && (
                                  <option value={account}>
                                    {t('governance_my_wallet')} ({account})
                                  </option>
                                )}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                  {reward.name}
                                </h4>
                                <p className="text-lg font-semibold text-gray-900">
                                  {reward.amount}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div>
                                <span className="text-gray-600 font-medium">
                                  {t('governance_reward_contract_address')}:
                                </span>
                                <p className="text-gray-800 font-mono text-xs break-all mt-0.5">
                                  {reward.contractAddress}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600 font-medium">
                                  {t('governance_reward_source')}:
                                </span>
                                <p className="text-gray-800 font-mono text-xs break-all mt-0.5">
                                  {reward.source}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Promotion Widget for Draft Proposals */}
            {currentProposal.status === 'draft' && isAuthor() && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('governance_promote_to_active')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('governance_ready_to_make_active')}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('governance_voting_start_date')}
                    </label>
                    <input
                      type="date"
                      value={promotionData.dateStart}
                      onChange={(e) =>
                        setPromotionData({
                          ...promotionData,
                          dateStart: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('governance_voting_duration')}
                    </label>
                    <select
                      value={promotionData.duration}
                      onChange={(e) =>
                        setPromotionData({
                          ...promotionData,
                          duration: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      <option value="7">{t('governance_days_minor')}</option>
                      <option value="14">{t('governance_days_standard')}</option>
                      <option value="28">{t('governance_days_larger')}</option>
                    </select>
                  </div>

                  <button
                    onClick={handlePromoteToActive}
                    disabled={
                      !isWalletReady || !promotionData.dateStart || isSubmitting
                    }
                    className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isSubmitting ? t('governance_promoting') : t('governance_promote_to_active')}
                  </button>
                </div>
              </div>
            )}

            {/* Voting Results for Active/Closed Proposals */}
            {freshProposalData?.status !== 'draft' && voteCounts && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">{t('governance_voting_results')}</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{t('governance_yes')}</span>
                      <span className="text-sm text-gray-600">
                        {roundToTwoDecimals(voteCounts.yes)} (
                        {getVotePercentage(voteCounts.yes, totalVotes)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gray-900 transition-all duration-300"
                        style={{
                          width: `${getVotePercentage(
                            voteCounts.yes,
                            totalVotes,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{t('governance_no')}</span>
                      <span className="text-sm text-gray-600">
                        {roundToTwoDecimals(voteCounts.no)} (
                        {getVotePercentage(voteCounts.no, totalVotes)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gray-600 transition-all duration-300"
                        style={{
                          width: `${getVotePercentage(
                            voteCounts.no,
                            totalVotes,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 font-medium">{t('governance_abstain')}</span>
                      <span className="text-sm text-gray-600">
                        {roundToTwoDecimals(voteCounts.abstain)} (
                        {getVotePercentage(voteCounts.abstain, totalVotes)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gray-400 transition-all duration-300"
                        style={{
                          width: `${getVotePercentage(
                            voteCounts.abstain,
                            totalVotes,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('governance_total_votes')}</span>
                    <span className="font-medium">{roundToTwoDecimals(totalVotes)}</span>
                  </div>
                  {quorum > 0 && (
                    <div className="pt-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-black italic">{t('governance_quorum_label')}</span>
                        <span className="text-black italic font-medium">
                          {roundToTwoDecimals(totalVotes)} / {roundToTwoDecimals(quorum)}
                        </span>
                      </div>
                      {isQuorumReached ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          <span aria-hidden="true">✓</span>
                          <span>{t('governance_quorum_reached')}</span>
                        </div>
                      ) : (
                        <div
                          className="w-full bg-gray-200 rounded-full h-2"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={quorumProgress}
                          aria-label={t('governance_quorum_label')}
                        >
                          <div
                            className="h-2 rounded-full bg-gray-900 transition-all duration-300"
                            style={{ width: `${quorumProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proposal Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('governance_proposal_information')}
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 mr-2">{t('governance_author_label')}</span>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                    {getAuthorName()}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600">{t('governance_status')}:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      getEffectiveStatus(freshProposalData || currentProposal).status,
                    )}`}
                  >
                    {getEffectiveStatus(freshProposalData || currentProposal).displayText}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('governance_created')}:</span>
                  <span className="ml-2">
                    {formatDate(String(currentProposal.created))}
                  </span>
                </div>
                {currentProposal.startDate && (
                  <div>
                    <span className="text-gray-600">{t('governance_start_date_label')}</span>
                    <span className="ml-2">
                      {formatDate(String(currentProposal.startDate))}
                    </span>
                  </div>
                )}
                {currentProposal.endDate && (
                  <div>
                    <span className="text-gray-600">{t('governance_end_date_label')}</span>
                    <span className="ml-2">
                      {formatDate(String(currentProposal.endDate))}
                    </span>
                  </div>
                )}
                {isActive && (
                  <div>
                    <span className="text-gray-600">{t('governance_time_remaining_label')}</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {getTimeRemaining(String(currentProposal.endDate || ''))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Info */}
            {currentProposal.authorSignature && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">{t('governance_verification')}</h3>

                <div className="space-y-3 text-sm  ">
                  <div>
                    <span className="text-gray-600">{t('governance_author_signature_label')}</span>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                      {currentProposal.authorSignature}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 mr-2">{t('governance_author_address_label')}</span>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                      {currentProposal.authorAddress}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

ProposalDetailPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  const slug = Array.isArray(query.slug) ? query.slug[0] : query.slug || '';

  try {
    const proposal = await api
        .get(`/proposal/${slug}`, {
          headers: getBearerAuthHeaders(req as NextApiRequest),
        })
        .catch(() => {
          return null;
        })

    let proposalCreator = null;
    if (proposal?.data?.results) {
      const proposalCreatorId = proposal.data.results.createdBy;
      try {
        const {
          data: { results: proposalCreatorData },
        } = await api.get(`/user/${proposalCreatorId}`, {
          headers: getBearerAuthHeaders(req as NextApiRequest),
        });
        proposalCreator = proposalCreatorData;
      } catch (err) {
      }
    }

    return {
      proposal: proposal?.data?.results || null,
      proposalCreator,
    };
  } catch (err: unknown) {
    return {
      proposal: null,
      proposalCreator: null,
      error: parseMessageFromError(err),
      };
  }
};

export default ProposalDetailPage;
