import React, { useState } from 'react';
import { NextPage, NextPageContext } from 'next';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import {
  ConnectWallet,
  ProposalList,
  VoteModal,
  CreateProposal,
  VotingWeight,
  PastVotes,
  Proposal,
} from '../../components/Governance';

const GovernancePage: NextPage = () => {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isCreateProposalModalOpen, setIsCreateProposalModalOpen] = useState(false);
  
  const handleSelectProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsVoteModalOpen(true);
  };
  
  const handleVote = async (proposalId: string, vote: 'yes' | 'no' | 'abstain'): Promise<boolean> => {
    // In a real implementation, this would submit the vote to Snapshot or a similar platform
    console.log(`Voting ${vote} on proposal ${proposalId}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  };
  
  const handleCreateProposal = async (proposal: {
    title: string;
    description: string;
    duration: number;
  }): Promise<boolean> => {
    // In a real implementation, this would submit the proposal to Snapshot or IPFS
    console.log('Creating proposal:', proposal);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  };
  
  return (
    <Layout>
      <Head>
        <title>TDF Governance</title>
        <meta
          name="description"
          content="Participate in the governance of Traditional Dream Factory"
        />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">TDF Governance</h1>
          <button
            onClick={() => setIsCreateProposalModalOpen(true)}
            className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded"
          >
            Create Proposal
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ProposalList
              onSelectProposal={handleSelectProposal}
              className="mb-6"
            />
          </div>
          
          <div className="space-y-6">
            <ConnectWallet />
            <VotingWeight />
            <PastVotes />
          </div>
        </div>
      </div>
      
      {isVoteModalOpen && selectedProposal && (
        <VoteModal
          proposal={selectedProposal}
          onClose={() => setIsVoteModalOpen(false)}
          onVote={handleVote}
        />
      )}
      
      {isCreateProposalModalOpen && (
        <CreateProposal
          onClose={() => setIsCreateProposalModalOpen(false)}
          onSubmit={handleCreateProposal}
        />
      )}
    </Layout>
  );
};

export default GovernancePage;

GovernancePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME);
    return {
      messages,
    };
  } catch (err) {
    return {
      error: err,
      messages: null,
    };
  }
};
