import { act, renderHook, waitFor } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  castProposalVote,
  createProposal,
  fetchProposal,
  fetchProposals,
  fetchVotingPowerSupply,
  finalizeProposalResult,
  publishProposal,
  refetchProposal,
  refreshProposalCache,
  updateProposal,
  useProposals,
} from '../proposals';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpcFor: jest.fn(() => ({ proposal: { get: { query: mockServerGet } } })),
  trpc: {
    proposal: {
      list: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      vote: { mutate: jest.fn() },
      publish: { mutate: jest.fn() },
      finalize: { mutate: jest.fn() },
      votingPowerSupply: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedTrpcFor = trpcFor as jest.Mock;
const proposal = trpc.proposal as unknown as {
  list: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  vote: { mutate: jest.Mock };
  publish: { mutate: jest.Mock };
  finalize: { mutate: jest.Mock };
  votingPowerSupply: { query: jest.Mock };
};

const budget = {
  _id: 'p1',
  slug: 'budget',
  title: 'Budget',
  createdBy: 'u1',
  votes: { yes: [], no: [], abstain: [] },
};

const voteData = { vote: 'yes', signature: '0xsig', votingWeight: 3 };
const voteAnswer = {
  message: 'Vote recorded',
  vote: { userId: 'u1', signature: '0xsig', weight: 3, votedAt: 'now' },
  results: budget,
  userVote: { castWeight: 3, remainingWeight: 0, lastVote: 'yes' },
};
const publishData = {
  title: 'Budget',
  authorAddress: '0xabc',
  authorSignature: '0xauthor',
  startDate: '2026-10-20T00:00:00.000Z',
  endDate: '2026-10-27T00:00:00.000Z',
};
const createData = {
  title: 'Budget',
  description: 'Spend',
  status: 'draft',
  createdBy: 'u1',
};

const makePlatform = () => ({
  proposal: {
    find: jest.fn(),
    areLoading: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
    getOne: jest.fn().mockResolvedValue(undefined),
    post: jest.fn().mockResolvedValue(undefined),
    patch: jest.fn().mockResolvedValue(undefined),
  },
});

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32004,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it("makes the citizens dashboard's GET /proposal?limit=N", async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [budget, {}] } });

    await expect(fetchProposals(200)).resolves.toEqual([budget, {}]);

    expect(mockedApi.get.mock.calls).toEqual([
      ['/proposal', { params: { limit: 200 } }],
    ]);
    expect(proposal.list.query).not.toHaveBeenCalled();
  });

  it('makes the server render GET /proposal/:search with and without the cookie', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: budget } });

    await expect(fetchProposal('budget', { token: 'ssr-jwt' })).resolves.toBe(
      budget,
    );
    await fetchProposal('budget', { token: undefined });

    expect(mockedApi.get.mock.calls).toEqual([
      ['/proposal/budget', { headers: { Authorization: 'Bearer ssr-jwt' } }],
      ['/proposal/budget', { headers: undefined }],
    ]);
    expect(mockedTrpcFor).not.toHaveBeenCalled();
  });

  it("re-reads one through the store's forced getOne, undefined when it failed", async () => {
    const platform = makePlatform();
    platform.proposal.getOne.mockResolvedValueOnce({
      results: fromJS(budget),
    });

    await expect(refetchProposal(platform, 'budget')).resolves.toEqual(budget);
    await expect(refetchProposal(platform, 'budget')).resolves.toBeUndefined();

    expect(platform.proposal.getOne).toHaveBeenCalledWith('budget', {
      force: true,
    });
    expect(proposal.get.query).not.toHaveBeenCalled();
  });

  it('refreshes the store after a write', () => {
    const platform = makePlatform();

    refreshProposalCache(platform, 'budget');

    expect(platform.proposal.getOne.mock.calls).toEqual([
      ['budget', { force: true }],
    ]);
    expect(platform.proposal.get.mock.calls).toEqual([[{}]]);
  });

  it('loads the list into the store and reads it from there', async () => {
    const platform = makePlatform();
    const list = fromJS([budget]);
    platform.proposal.find.mockReturnValue(list);
    platform.proposal.areLoading.mockReturnValue(undefined);

    const { result } = renderHook(() => useProposals(platform));
    await act(() => result.current.loadProposals());

    expect(platform.proposal.get.mock.calls).toEqual([[{}]]);
    expect(result.current.proposals).toBe(list);
    expect(result.current.isLoading).toBe(false);
    expect(platform.proposal.find).toHaveBeenCalledWith({});
    expect(proposal.list.query).not.toHaveBeenCalled();
  });

  it("posts a create through the store's post, unchanged", async () => {
    const platform = makePlatform();

    await createProposal(platform, createData);

    expect(platform.proposal.post).toHaveBeenCalledWith(createData);
    expect(proposal.create.mutate).not.toHaveBeenCalled();
  });

  it("patches through the store and answers no proposal, as the store's action never held one", async () => {
    const platform = makePlatform();

    await expect(
      updateProposal(platform, 'p1', { title: 'Budget 2' }),
    ).resolves.toBeUndefined();

    expect(platform.proposal.patch).toHaveBeenCalledWith('p1', {
      title: 'Budget 2',
    });
    expect(proposal.update.mutate).not.toHaveBeenCalled();
  });

  it('makes POST /proposals/:id/vote and answers its body', async () => {
    mockedApi.post.mockResolvedValue({ data: voteAnswer });

    await expect(castProposalVote('p1', voteData)).resolves.toBe(voteAnswer);

    expect(mockedApi.post).toHaveBeenCalledWith('/proposals/p1/vote', voteData);
    expect(proposal.vote.mutate).not.toHaveBeenCalled();
  });

  it('makes POST /proposals/:id/publish and answers its {proposal}', async () => {
    mockedApi.post.mockResolvedValue({ data: { proposal: budget } });

    await expect(publishProposal('p1', publishData)).resolves.toEqual({
      proposal: budget,
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/proposals/p1/publish',
      publishData,
    );
    expect(proposal.publish.mutate).not.toHaveBeenCalled();
  });

  it('makes POST /proposals/:id/finalize and answers its {proposal}', async () => {
    mockedApi.post.mockResolvedValue({ data: { proposal: budget } });

    await expect(finalizeProposalResult('p1')).resolves.toEqual({
      proposal: budget,
    });

    expect(mockedApi.post.mock.calls).toEqual([['/proposals/p1/finalize']]);
    expect(proposal.finalize.mutate).not.toHaveBeenCalled();
  });

  it('reads GET /sum/user/wallet into the voting power supply', async () => {
    mockedApi.get.mockResolvedValue({
      data: { results: { tdf: 10, presence: 5, sweat: 2 } },
    });

    await expect(fetchVotingPowerSupply()).resolves.toEqual({
      tdf: 10,
      presence: 5,
      sweat: 2,
    });

    expect(mockedApi.get.mock.calls).toEqual([['/sum/user/wallet']]);
    expect(proposal.votingPowerSupply.query).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it("lists the citizens dashboard's proposals with only its limit", async () => {
    proposal.list.query.mockResolvedValue([budget, {}]);

    await expect(fetchProposals(200)).resolves.toEqual([budget, {}]);

    expect(proposal.list.query).toHaveBeenCalledWith({ limit: 200 });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads one on a server render client of its own', async () => {
    mockServerGet.mockResolvedValue(budget);

    await expect(fetchProposal('budget', { token: 'ssr-jwt' })).resolves.toBe(
      budget,
    );
    await fetchProposal('budget', { token: undefined });

    expect(mockedTrpcFor.mock.calls).toEqual([['ssr-jwt'], [undefined]]);
    expect(mockServerGet).toHaveBeenCalledWith({ idOrSlug: 'budget' });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('rejects a missing proposal so the server render falls back to null', async () => {
    mockServerGet.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'Proposal not found'),
    );

    await expect(
      fetchProposal('gone', { token: undefined }),
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('re-reads one by slug, undefined when the read fails', async () => {
    const platform = makePlatform();
    proposal.get.query.mockResolvedValueOnce(budget);
    proposal.get.query.mockRejectedValueOnce(new Error('down'));

    await expect(refetchProposal(platform, 'budget')).resolves.toBe(budget);
    await expect(refetchProposal(platform, 'budget')).resolves.toBeUndefined();

    expect(proposal.get.query).toHaveBeenCalledWith({ idOrSlug: 'budget' });
    expect(platform.proposal.getOne).not.toHaveBeenCalled();
  });

  it('leaves the unread store alone after a write', () => {
    const platform = makePlatform();

    refreshProposalCache(platform, 'budget');

    expect(platform.proposal.getOne).not.toHaveBeenCalled();
    expect(platform.proposal.get).not.toHaveBeenCalled();
  });

  it('holds the list newest first in local state as Immutable', async () => {
    const platform = makePlatform();
    proposal.list.query.mockResolvedValue([budget, {}]);

    const { result } = renderHook(() => useProposals(platform));
    await act(() => result.current.loadProposals());

    expect(proposal.list.query).toHaveBeenCalledWith({ sortBy: '-created' });
    expect(result.current.proposals?.toJS()).toEqual([budget, {}]);
    expect(result.current.isLoading).toBe(false);
    expect(platform.proposal.get).not.toHaveBeenCalled();
    expect(platform.proposal.find).not.toHaveBeenCalled();
  });

  it('keeps the last list when a reload fails, as the store did', async () => {
    const platform = makePlatform();
    proposal.list.query.mockResolvedValueOnce([budget]);
    proposal.list.query.mockRejectedValueOnce(new Error('down'));

    const { result } = renderHook(() => useProposals(platform));
    await act(() => result.current.loadProposals());
    await act(() => result.current.loadProposals());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.proposals?.toJS()).toEqual([budget]);
  });

  it('creates through the procedure and rejects with the API text', async () => {
    const platform = makePlatform();
    proposal.create.mutate.mockResolvedValueOnce(budget);
    proposal.create.mutate.mockRejectedValueOnce(
      trpcError('CONFLICT', 409, 'A similar entry already exists.'),
    );

    await createProposal(platform, createData);
    const error = await createProposal(platform, createData).catch((e) => e);

    expect(proposal.create.mutate).toHaveBeenCalledWith(createData);
    expect(parseMessageFromError(error)).toBe(
      'A similar entry already exists.',
    );
    expect(platform.proposal.post).not.toHaveBeenCalled();
  });

  it('updates by id and answers the saved proposal', async () => {
    const platform = makePlatform();
    proposal.update.mutate.mockResolvedValue(budget);

    await expect(
      updateProposal(platform, 'p1', { title: 'Budget' }),
    ).resolves.toBe(budget);

    expect(proposal.update.mutate).toHaveBeenCalledWith({
      idOrSlug: 'p1',
      data: { title: 'Budget' },
    });
    expect(platform.proposal.patch).not.toHaveBeenCalled();
  });

  it("votes and answers legacy's body, which is the procedure's", async () => {
    proposal.vote.mutate.mockResolvedValue(voteAnswer);

    await expect(castProposalVote('p1', voteData)).resolves.toBe(voteAnswer);

    expect(proposal.vote.mutate).toHaveBeenCalledWith({
      id: 'p1',
      ...voteData,
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("puts a vote error's code where the page's switch reads it", async () => {
    proposal.vote.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'voting_period_not_active'),
    );

    await expect(castProposalVote('p1', voteData)).rejects.toMatchObject({
      response: { status: 400, data: { error: 'voting_period_not_active' } },
    });
  });

  it('publishes and wraps the proposal in legacy {proposal}', async () => {
    proposal.publish.mutate.mockResolvedValue(budget);

    await expect(publishProposal('p1', publishData)).resolves.toEqual({
      proposal: budget,
    });

    expect(proposal.publish.mutate).toHaveBeenCalledWith({
      id: 'p1',
      ...publishData,
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('finalizes and wraps the proposal in legacy {proposal}', async () => {
    proposal.finalize.mutate.mockResolvedValue(budget);

    await expect(finalizeProposalResult('p1')).resolves.toEqual({
      proposal: budget,
    });

    expect(proposal.finalize.mutate).toHaveBeenCalledWith({ id: 'p1' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('reads the voting power supply from the procedure', async () => {
    proposal.votingPowerSupply.query.mockResolvedValue({
      tdf: 10,
      presence: 5,
      sweat: 2,
    });

    await expect(fetchVotingPowerSupply()).resolves.toEqual({
      tdf: 10,
      presence: 5,
      sweat: 2,
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
