import React, { useState, useEffect, useContext, useRef } from 'react';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import { Proposal } from 'closer/types';
import { createVoteSignatureHash, verifyProposalSignature, createProposalSignatureHash } from 'closer/utils/crypto';
import { slugify } from 'closer/utils/common';
import { parseMessageFromError } from 'closer/utils/common';
import ProposalComments from 'closer/components/Governance/ProposalComments';
import { api } from 'closer';
import { NextApiRequest } from 'next';

interface ProposalDetailPageProps {
  proposal: Proposal | null;
  proposalCreator: any;
  error?: string;
  messages: any;
}

const ProposalDetailPage: NextPage<ProposalDetailPageProps> = ({ proposal, proposalCreator, error: propError, messages }) => {
  const router = useRouter();
  const { isWalletReady, account } = useContext(WalletState);
  const { signMessage } = useContext(WalletDispatch);
  const { user } = useAuth();
  const { platform } = usePlatform() as any;
  
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | 'abstain' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<'yes' | 'no' | 'abstain' | null>(null);
  const [error, setError] = useState<string | null>(propError || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    slug: '',
    description: ''
  });
  const [promotionData, setPromotionData] = useState({
    dateStart: '',
    duration: '14' // Default to 14 days (standard)
  });
  const hasLoaded = useRef(false);

  const isCitizen = (): boolean => {
    return user?.roles?.includes('member') || false;
  };

  const isAuthor = (): boolean => {
    return user?._id === proposal?.createdBy;
  };

  const canEdit = (): boolean => {
    return isAuthor() && proposal?.status === 'draft';
  };

  // Initialize edit data when proposal loads
  useEffect(() => {
    if (proposal && !isEditing) {
      setEditData({
        title: proposal.title || '',
        slug: proposal.slug || '',
        description: proposal.description || ''
      });
    }
  }, [proposal, isEditing]);

  // Generate slug from title when editing (same logic as EditModel)
  useEffect(() => {
    if (isEditing && editData.title && editData.title.trim().length > 0) {
      const generatedSlug = slugify(editData.title.trim());
      if (generatedSlug && generatedSlug !== editData.slug) {
        setEditData({ ...editData, slug: generatedSlug });
      }
    }
  }, [editData.title, editData.slug, isEditing]);

  const handleVote = async () => {
    if (!proposal || !selectedVote || !isWalletReady || !account) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create vote signature hash
      const voteSignatureHash = createVoteSignatureHash(proposal.description, selectedVote);
      
      // In a real implementation, this would sign a message with the wallet
      // and submit the vote to Snapshot or a similar platform
      const message = `I am voting ${selectedVote} on proposal ${proposal._id}`;
      const signature = await signMessage(message, account);
      
      if (!signature) {
        throw new Error('Failed to sign vote message');
      }
      
      // Create vote data with signature hash
      const voteData = {
        proposalId: proposal._id,
        userId: user?._id || '',
        vote: selectedVote,
        votingPower: 1, // In a real implementation, this would be calculated based on token holdings
        timestamp: new Date().toISOString(),
        signatureHash: voteSignatureHash,
      };
      
      // Submit vote to platform context
      const voteResponse = await platform.proposalVote.post(voteData);

      // Update local state
      setHasVoted(true);
      setUserVote(selectedVote);
      
      // Refresh the proposal data from the platform context
      platform.proposal.getOne(proposal.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
      title: proposal?.title || '',
      slug: proposal?.slug || '',
      description: proposal?.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!proposal) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const updatedData = {
        ...proposal,
        ...editData,
        updated: new Date().toISOString()
      };

      await platform.proposal.patch(proposal._id, updatedData);
      
      // Refresh the proposal data from the platform context
      platform.proposal.getOne(proposal.slug);
      
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveToReady = async () => {
    if (!proposal || !isWalletReady || !account) return;
    
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
        ...proposal,
        ...editData,
        status: 'ready',
        authorAddress: account,
        signatureHash: descriptionHash,
        authorSignature: authorSignature,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
        votes: {
          yes: 0,
          no: 0,
          abstain: 0,
        },
        updated: new Date().toISOString()
      };
      
      const response = await platform.proposal.patch(proposal._id, updatedData);
      
      // Update local state with the response data
      if (response?.data?.results) {
        // Update the proposal state with the new data
        // Refresh the proposal data from the platform context
        platform.proposal.getOne(proposal.slug);
        setEditData({
          title: response.data.results.title || '',
          slug: response.data.results.slug || '',
          description: response.data.results.description || ''
        });
      }
      
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move proposal to ready status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromoteToActive = async () => {
    if (!proposal || !isWalletReady || !account || !promotionData.dateStart) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Calculate end date from start date and duration
      const startDate = new Date(promotionData.dateStart);
      const durationDays = parseInt(promotionData.duration);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);
      
      // Create proposal description hash for signature
      const descriptionHash = createProposalSignatureHash(proposal.description);
      
      // Sign the proposal description hash for author verification
      const authorSignature = await signMessage(descriptionHash, account);
      
      if (!authorSignature) {
        throw new Error('Failed to sign proposal description');
      }
      
      // Call the promotion API
      await api.post(`/proposals/${proposal._id}/promote`, {
        dateStart: promotionData.dateStart,
        dateEnd: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        signatureHash: descriptionHash,
        authorAddress: account,
        authorSignature: authorSignature
      });
      
      // Refresh the proposal data from the platform context
      platform.proposal.getOne(proposal.slug);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote proposal to active status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Voting ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours remaining`;
    return `${hours} hours remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'draft':
        return 'text-blue-600 bg-blue-100';
      case 'ready':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };


  if (error || !proposal) {
    return (
      <>
        <Head>
          <title>Proposal Not Found - TDF Governance</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'The requested proposal could not be found.'}</p>
            <button
              onClick={() => router.push('/governance')}
              className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded"
            >
              Back to Governance
            </button>
          </div>
        </div>
      </>
    );
  }

  const totalVotes = (proposal.votes?.yes || 0) + (proposal.votes?.no || 0) + (proposal.votes?.abstain || 0);
  const isActive = proposal.status === 'active' && proposal.endDate && new Date() < new Date(proposal.endDate);

  return (
    <>
      <Head>
        <title>{proposal.title} - TDF Governance</title>
        <meta
          name="description"
          content={proposal.description.substring(0, 160)}
        />
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/governance')}
            className="text-accent hover:text-accent-dark mb-4 flex items-center"
          >
            ← Back to Governance
          </button>
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>by {proposalCreator?.screenname || proposalCreator?.email || proposal.authorAddress || 'Anonymous'}</span>
                <span>•</span>
                <span>{formatDate(proposal.created)}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                  {proposal.status.toUpperCase()}
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
                    Edit
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-md text-sm disabled:opacity-50"
                    >
                      Save
                    </button>
                    {isWalletReady && (
                      <button
                        onClick={handleMoveToReady}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-50"
                      >
                        Move to Ready
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
                  <p className="text-blue-800 font-medium">Voting is active</p>
                  <p className="text-blue-600 text-sm">{getTimeRemaining(proposal.endDate || '')}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-800 font-medium">{totalVotes} votes</p>
                  <p className="text-blue-600 text-sm">Ends {formatDate(proposal.endDate || '')}</p>
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
              <h2 className="text-xl font-semibold mb-4">Proposal Content</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      id="edit-title"
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-slug" className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (optional)
                    </label>
                    <input
                      id="edit-slug"
                      type="text"
                      value={editData.slug}
                      onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Auto-generated from title"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty to use auto-generated slug from title
                    </p>
                  </div>
                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      id="edit-description"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                      rows={15}
                    />
                  </div>
                </div>
              ) : (
                <div className="markdown">
                  <ReactMarkdown>{proposal.description}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Comments */}
            <ProposalComments proposal={proposal} />

            {/* Voting Section */}
            {isActive && isWalletReady && isCitizen() && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {hasVoted ? 'Your Vote' : 'Cast Your Vote'}
                </h2>
                
                {hasVoted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      You voted: <span className="capitalize">{userVote}</span>
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Thank you for participating in the governance process.
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
                            onChange={(e) => setSelectedVote(e.target.value as 'yes' | 'no' | 'abstain')}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">{option}</span>
                              <span className="text-sm text-gray-500">
                                {option === 'yes' && 'Support this proposal'}
                                {option === 'no' && 'Reject this proposal'}
                                {option === 'abstain' && 'Neutral on this proposal'}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-800">{error}</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleVote}
                      disabled={!selectedVote || isSubmitting}
                      className="w-full bg-accent hover:bg-accent-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      {isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Voting Requirements */}
            {isActive && (!isWalletReady || !isCitizen()) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Voting Requirements</h3>
                <div className="space-y-2 text-yellow-700">
                  {!isWalletReady && <p>• Connect your wallet to vote</p>}
                  {!isCitizen() && <p>• You must be a member to vote on proposals</p>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Promotion Widget for Draft Proposals */}
            {proposal.status === 'draft' && isAuthor() && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Promote to Active</h3>
                <p className="text-gray-600 mb-4">
                  Ready to make this proposal active? This will require a web3 signature to verify your identity.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voting Start Date
                    </label>
                    <input
                      type="date"
                      value={promotionData.dateStart}
                      onChange={(e) => setPromotionData({ ...promotionData, dateStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voting Duration
                    </label>
                    <select
                      value={promotionData.duration}
                      onChange={(e) => setPromotionData({ ...promotionData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="7">7 days (minor impact only)</option>
                      <option value="14">14 days (standard)</option>
                      <option value="28">28 days (larger impact)</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handlePromoteToActive}
                    disabled={!isWalletReady || !promotionData.dateStart || isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Promoting...' : 'Promote to Active'}
                  </button>
                </div>
              </div>
            )}

            {/* Voting Results for Active/Closed Proposals */}
            {proposal.status !== 'draft' && proposal.votes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Voting Results</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-600 font-medium">Yes</span>
                      <span className="text-sm text-gray-600">
                        {proposal.votes.yes} ({getVotePercentage(proposal.votes.yes, totalVotes)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getVotePercentage(proposal.votes.yes, totalVotes)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-red-600 font-medium">No</span>
                      <span className="text-sm text-gray-600">
                        {proposal.votes.no} ({getVotePercentage(proposal.votes.no, totalVotes)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getVotePercentage(proposal.votes.no, totalVotes)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 font-medium">Abstain</span>
                      <span className="text-sm text-gray-600">
                        {proposal.votes.abstain} ({getVotePercentage(proposal.votes.abstain, totalVotes)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getVotePercentage(proposal.votes.abstain, totalVotes)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Votes</span>
                    <span className="font-medium">{totalVotes}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Proposal Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Proposal Information</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Author:</span>
                  <span className="ml-2 font-medium">{proposal.authorAddress || 'Anonymous'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2">{formatDate(proposal.created)}</span>
                </div>
                {proposal.startDate && (
                  <div>
                    <span className="text-gray-600">Start Date:</span>
                    <span className="ml-2">{formatDate(proposal.startDate)}</span>
                  </div>
                )}
                {proposal.endDate && (
                  <div>
                    <span className="text-gray-600">End Date:</span>
                    <span className="ml-2">{formatDate(proposal.endDate)}</span>
                  </div>
                )}
                {isActive && (
                  <div>
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className="ml-2 text-accent font-medium">{getTimeRemaining(proposal.endDate || '')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Info */}
            {proposal.signatureHash && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Verification</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Signature Hash:</span>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                      {proposal.signatureHash}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Verified:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      verifyProposalSignature(proposal.description, proposal.signatureHash)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {verifyProposalSignature(proposal.description, proposal.signatureHash)
                        ? '✓ Valid'
                        : '✗ Invalid'}
                    </span>
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
