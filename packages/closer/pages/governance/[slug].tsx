import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import ProposalComments from 'closer/components/Governance/ProposalComments';

import { ErrorMessage, api } from 'closer';
import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { WalletDispatch, WalletState } from 'closer/contexts/wallet';
import { useVotingWeight } from 'closer/hooks/useVotingWeight';
import { Proposal, ProposalReward } from 'closer/types';
import { parseMessageFromError, slugify } from 'closer/utils/common';
import {
  createProposalSignatureHash,
  createVoteSignatureHash,
} from 'closer/utils/crypto';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextApiRequest, NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface ProposalDetailPageProps {
  proposal: Proposal | null;
  proposalCreator: any;
  error?: string;
  messages: any;
}

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
      return screenname || email || currentProposal.authorAddress || 'Anonymous';
    }

    return currentProposal.authorAddress || 'Anonymous';
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

  // Helper function to get the most up-to-date proposal data
  const getCurrentProposalData = () => {
    if (currentProposal?.slug) {
      const platformProposal = platform.proposal.findOne(currentProposal.slug);
      if (platformProposal && platformProposal.toJS) {
        return platformProposal.toJS();
      }
    }
    return currentProposal;
  };

  const handleVote = async () => {
    if (!currentProposal || !selectedVote || !isWalletReady || !account) return;

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
      throw new Error('Failed to sign vote message');
    }

    // Create vote data with signature hash
    const voteData = {
      votingWeight: votingWeight || 1,
      signature: voteSignatureHash,
      vote: selectedVote,
    };
    try {
      // Submit vote to platform context
      await api.post(`/proposals/${currentProposal._id}/vote`, voteData);

      // Update local state
      setHasVoted(true);
      setUserVote(selectedVote);
      setShowVoteSuccess(true);

      // Refresh the proposal data from the platform context
      const refreshedProposal = await platform.proposal.getOne(
        currentProposal.slug,
      );

      // Update local state with the refreshed data
      if (refreshedProposal?.results) {
        setCurrentProposal(refreshedProposal.results.toJS());
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowVoteSuccess(false);
      }, 3000);
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
      platform.proposal.getOne(currentProposal.slug);

      // Also refresh the proposals list to ensure updated data is visible
      platform.proposal.get({});

      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update proposal',
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
        throw new Error('Failed to sign proposal description');
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
        platform.proposal.getOne(currentProposal.slug);
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
          : 'Failed to move proposal to ready status',
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
        throw new Error('Failed to sign proposal description');
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
      platform.proposal.getOne(currentProposal.slug);

      // Also refresh the proposals list to ensure updated data is visible
      platform.proposal.get({});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to promote proposal to active status',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return t('governance_not_available');
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return t('governance_not_available');
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return t('governance_voting_ended');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return t('governance_days_hours_remaining', { days, hours });
    return t('governance_hours_remaining', { hours });
  };

  // Get effective status for display (draft > active > passed/failed)
  const getEffectiveStatus = (proposal: Proposal | null): {
    status: 'draft' | 'active' | 'passed' | 'failed';
    displayText: string;
  } => {
    if (!proposal) {
      return { status: 'draft', displayText: t('governance_status_unknown') };
    }

    const currentStatus = proposal.status;
    const endDate = proposal.endDate;

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
      const results = proposal.results;
      const votes = proposal.votes;

      let voteCounts = { yes: 0, no: 0, abstain: 0 };

      if (results !== undefined && results !== null) {
        voteCounts = Object.assign(
          { yes: 0, no: 0, abstain: 0 },
          results,
        );
      } else if (votes) {
        if (Array.isArray(votes.yes)) {
          voteCounts.yes = votes.yes.reduce(
            (sum: number, vote: any) => sum + (vote.weight || 0),
            0,
          );
        } else {
          voteCounts.yes = votes.yes || 0;
        }

        if (Array.isArray(votes.no)) {
          voteCounts.no = votes.no.reduce(
            (sum: number, vote: any) => sum + (vote.weight || 0),
            0,
          );
        } else {
          voteCounts.no = votes.no || 0;
        }

        if (Array.isArray(votes.abstain)) {
          voteCounts.abstain = votes.abstain.reduce(
            (sum: number, vote: any) => sum + (vote.weight || 0),
            0,
          );
        } else {
          voteCounts.abstain = votes.abstain || 0;
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

  const getStatusColor = (status: 'draft' | 'active' | 'passed' | 'failed'): string => {
    switch (status) {
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'passed':
        return 'bg-emerald-100 text-emerald-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
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
          <title>{t('governance_proposal_not_found')} - TDF Governance</title>
        </Head>
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
              className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded"
            >
              {t('governance_back_to_governance')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // Get the most up-to-date proposal data for voting results
  const freshProposalData = getCurrentProposalData();
  const voteCounts = Object.assign({ yes: 0, no: 0, abstain: 0 }, freshProposalData?.results);
  const totalVotes = voteCounts.yes + voteCounts.no + voteCounts.abstain;
  const isActive =
    freshProposalData?.status === 'active' &&
    freshProposalData?.endDate &&
    new Date() < new Date(freshProposalData.endDate);

  return (
    <>
      <Head>
        <title>{currentProposal.title} - TDF Governance</title>
        <meta
          name="description"
          content={currentProposal.description?.substring(0, 160) || ''}
        />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/governance?refetch=true')}
            className="text-accent hover:text-accent-dark mb-4 flex items-center"
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
                      className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-md text-sm disabled:opacity-50"
                    >
                      {t('governance_save')}
                    </button>
                    {isWalletReady && (
                      <button
                        onClick={handleMoveToReady}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-50"
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-medium">{t('governance_voting_is_active')}</p>
                  <p className="text-blue-600 text-sm">
                    {getTimeRemaining(String(freshProposalData?.endDate || ''))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-blue-800 font-medium">
                    {totalVotes} {t('governance_votes')}
                  </p>
                  <p className="text-blue-600 text-sm">
                    {t('governance_ends')} {formatDate(String(freshProposalData?.endDate || ''))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Proposal Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('governance_proposal_content')}</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-title"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Title
                    </label>
                    <input
                      id="edit-title"
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-slug"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Slug (optional)
                    </label>
                    <input
                      id="edit-slug"
                      type="text"
                      value={editData.slug}
                      onChange={(e) =>
                        setEditData({ ...editData, slug: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Auto-generated from title"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty to use auto-generated slug from title
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                      rows={15}
                    />
                  </div>
                </div>
              ) : (
                <div className="markdown">
                  <ReactMarkdown>{currentProposal.description}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Comments */}
            <ProposalComments proposal={currentProposal} />

            {/* Voting Section */}
            {isActive && isWalletReady && isCitizen() && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {hasVoted ? t('governance_your_vote') : t('governance_cast_your_vote')}
                </h2>

                {showVoteSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-medium">
                      {t('governance_vote_submitted_success')}
                    </p>
                  </div>
                )}

                {hasVoted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      {t('governance_you_voted')} <span className="capitalize">{userVote}</span>
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      {t('governance_thank_you_participating')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-3 mb-6">
                      {(['yes', 'no', 'abstain'] as const).map((option) => (
                        <label
                          key={option}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedVote === option
                              ? 'border-accent bg-accent-light'
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
                      disabled={!selectedVote || isSubmitting}
                      className="w-full bg-accent hover:bg-accent-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      {isSubmitting ? t('governance_submitting_vote') : t('governance_submit_vote')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Voting Requirements */}
            {isActive && (!isWalletReady || !isCitizen()) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  {t('governance_voting_requirements')}
                </h3>
                <div className="space-y-2 text-yellow-700">
                  {!isWalletReady && <p>• {t('governance_connect_wallet_to_vote')}</p>}
                  {!isCitizen() && (
                    <p>• {t('governance_must_be_member')}</p>
                  )}
                </div>
              </div>
            )}
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
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('governance_rewards')}
                    </h3>
                    {canEdit() && isEditing && (
                      <button
                        type="button"
                        onClick={handleAddReward}
                        className="px-3 py-1.5 bg-accent hover:bg-accent-dark text-white text-xs rounded-md"
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
                                className="text-red-600 hover:text-red-800 text-xs"
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
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono"
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
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
                                <p className="text-lg font-bold text-accent">
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
              <div className="bg-white rounded-lg shadow-sm p-6">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    {isSubmitting ? t('governance_promoting') : t('governance_promote_to_active')}
                  </button>
                </div>
              </div>
            )}

            {/* Voting Results for Active/Closed Proposals */}
            {freshProposalData?.status !== 'draft' && voteCounts && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">{t('governance_voting_results')}</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-600 font-medium">{t('governance_yes')}</span>
                      <span className="text-sm text-gray-600">
                        {roundToTwoDecimals(voteCounts.yes)} (
                        {getVotePercentage(voteCounts.yes, totalVotes)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
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
                      <span className="text-red-600 font-medium">{t('governance_no')}</span>
                      <span className="text-sm text-gray-600">
                        {roundToTwoDecimals(voteCounts.no)} (
                        {getVotePercentage(voteCounts.no, totalVotes)}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
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
                        className="bg-gray-500 h-2 rounded-full transition-all duration-300"
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
                  {freshProposalData?.quorum && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black italic">{t('governance_quorum_label')}</span>
                      <span className="text-black italic font-medium">
                        {roundToTwoDecimals(totalVotes)} / {roundToTwoDecimals(freshProposalData.quorum)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proposal Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
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
                    <span className="ml-2 text-accent font-medium">
                      {getTimeRemaining(String(currentProposal.endDate || ''))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Info */}
            {currentProposal.authorSignature && (
              <div className="bg-white rounded-lg shadow-sm p-6">
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
    </>
  );
};

ProposalDetailPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  const slug = Array.isArray(query.slug) ? query.slug[0] : query.slug || '';

  try {
    const [proposal, messages] = await Promise.all([
      api
        .get(`/proposal/${slug}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        })
        .catch(() => {
          return null;
        }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    let proposalCreator = null;
    if (proposal?.data?.results) {
      const proposalCreatorId = proposal.data.results.createdBy;
      console.log('proposalCreatorId', proposalCreatorId);
      try {
        const {
          data: { results: proposalCreatorData },
        } = await api.get(`/user/${proposalCreatorId}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        });
        proposalCreator = proposalCreatorData;
      } catch (err) {
        // Silently handle error - proposal will show without creator info
      }
    }

    return {
      proposal: proposal?.data?.results || null,
      proposalCreator,
      messages,
    };
  } catch (err: unknown) {
    return {
      proposal: null,
      proposalCreator: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ProposalDetailPage;
