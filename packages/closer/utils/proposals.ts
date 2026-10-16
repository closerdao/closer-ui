import { useCallback, useState } from 'react';

import { List, fromJS } from 'immutable';

import type { Proposal } from '../types/proposal';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc, trpcFor } from './trpc';
import { VotingPowerSupply, parseWalletSums } from './votingPower.helpers';

type Platform = Record<string, any>;

type CreateInput = Parameters<typeof trpc.proposal.create.mutate>[0];
type UpdateInput = Parameters<typeof trpc.proposal.update.mutate>[0]['data'];
type VoteInput = Omit<Parameters<typeof trpc.proposal.vote.mutate>[0], 'id'>;
type PublishInput = Omit<
  Parameters<typeof trpc.proposal.publish.mutate>[0],
  'id'
>;

// The store's filter for the governance list; it adds `sort_by: '-created'`.
const ALL_PROPOSALS = {};

// Legacy `GET /proposal?limit=N`; `{}` stands for a proposal the caller cannot read.
export const fetchProposals = async (limit: number): Promise<Proposal[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/proposal', { params: { limit } });
    return res?.data?.results;
  }
  const results = await trpc.proposal.list
    .query({ limit })
    .catch(throwApiError);
  return results as Proposal[];
};

// Legacy `GET /proposal/:search` for a server render, with its cookie token.
export const fetchProposal = async (
  idOrSlug: string,
  options: { token: string | undefined },
): Promise<Proposal> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/proposal/${idOrSlug}`, {
      headers: options.token
        ? { Authorization: `Bearer ${options.token}` }
        : undefined,
    });
    return res.data.results;
  }
  const result = await trpcFor(options.token)
    .proposal.get.query({ idOrSlug })
    .catch(throwApiError);
  return result as Proposal;
};

// The store's forced `getOne`, which resolves with no proposal on a failed read.
export const refetchProposal = async (
  platform: Platform,
  slug: string,
): Promise<Proposal | undefined> => {
  if (!isTrpcEnabled()) {
    const res = await platform.proposal.getOne(slug, { force: true });
    return res?.results?.toJS();
  }
  const result = await trpc.proposal.get
    .query({ idOrSlug: slug })
    .catch(() => undefined);
  return result as Proposal | undefined;
};

// Legacy re-reads into the store after a write; with tRPC nothing reads the store and ProposalList loads on mount.
export const refreshProposalCache = (platform: Platform, slug?: string) => {
  if (isTrpcEnabled()) return;
  platform.proposal.getOne(slug, { force: true });
  platform.proposal.get(ALL_PROPOSALS);
};

// The governance list: the store's read or, with tRPC, the same read in local state; Immutable either way.
export const useProposals = (platform: Platform) => {
  const [trpcProposals, setTrpcProposals] = useState<List<any>>();
  const [isTrpcLoading, setIsTrpcLoading] = useState(false);

  const loadProposals = useCallback(async () => {
    if (!isTrpcEnabled()) {
      await platform.proposal.get(ALL_PROPOSALS);
      return;
    }
    setIsTrpcLoading(true);
    try {
      const results = await trpc.proposal.list.query({ sortBy: '-created' });
      setTrpcProposals(fromJS(results) as List<any>);
    } catch {
      // The store's get resolves on failure, so a failed read shows the last list.
    } finally {
      setIsTrpcLoading(false);
    }
  }, [platform?.proposal]);

  if (isTrpcEnabled()) {
    return {
      proposals: trpcProposals,
      isLoading: isTrpcLoading,
      loadProposals,
    };
  }
  return {
    proposals: platform.proposal.find(ALL_PROPOSALS) as List<any> | undefined,
    isLoading: Boolean(platform.proposal.areLoading(ALL_PROPOSALS)),
    loadProposals,
  };
};

// The store's post resolves on failure; with tRPC a failed create throws, as other writes do.
export const createProposal = async (
  platform: Platform,
  data: CreateInput & Record<string, unknown>,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await platform.proposal.post(data);
    return;
  }
  await trpc.proposal.create.mutate(data).catch(throwApiError);
};

// The store's patch resolves with its action, never a proposal, so legacy keeps the page's local merge.
export const updateProposal = async (
  platform: Platform,
  id: string,
  data: UpdateInput,
): Promise<Proposal | undefined> => {
  if (!isTrpcEnabled()) {
    await platform.proposal.patch(id, data);
    return undefined;
  }
  const result = await trpc.proposal.update
    .mutate({ idOrSlug: id, data })
    .catch(throwApiError);
  return result as Proposal;
};

// Legacy `POST /proposals/:id/vote`: `{message, vote, results, userVote}` on both.
export const castProposalVote = async (id: string, data: VoteInput) => {
  if (!isTrpcEnabled()) {
    const res = await api.post(`/proposals/${id}/vote`, data);
    return res.data;
  }
  return trpc.proposal.vote.mutate({ id, ...data }).catch(throwApiError);
};

// Legacy `POST /proposals/:id/publish` answers `{proposal}`; the procedure answers the proposal.
export const publishProposal = async (
  id: string,
  data: PublishInput,
): Promise<{ proposal: Proposal }> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(`/proposals/${id}/publish`, data);
    return res.data;
  }
  const proposal = await trpc.proposal.publish
    .mutate({ id, ...data })
    .catch(throwApiError);
  return { proposal: proposal as Proposal };
};

// Legacy `POST /proposals/:id/finalize` answers `{proposal}`; the procedure answers the proposal.
export const finalizeProposalResult = async (
  id: string,
): Promise<{ proposal: Proposal }> => {
  if (!isTrpcEnabled()) {
    const res = await api.post(`/proposals/${id}/finalize`);
    return res.data;
  }
  const proposal = await trpc.proposal.finalize
    .mutate({ id })
    .catch(throwApiError);
  return { proposal: proposal as Proposal };
};

// Legacy `GET /sum/user/wallet` answers `{results: {tdf, presence, sweat}}`.
export const fetchVotingPowerSupply = async (): Promise<VotingPowerSupply> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/sum/user/wallet');
    return parseWalletSums(res?.data);
  }
  const results = await trpc.proposal.votingPowerSupply
    .query()
    .catch(throwApiError);
  return parseWalletSums({ results });
};
