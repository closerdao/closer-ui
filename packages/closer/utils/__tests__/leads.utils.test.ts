import api from '../api';
import {
  contactLead,
  enrichLead,
  fetchLead,
  fetchLeadActions,
  fetchLeadsBoard,
  fetchLeadsCounts,
  fetchVillageFit,
  inviteLeadToProgram,
  patchLead,
  previewLeadEmail,
  sendLeadEmail,
  startConversationFromApplication,
  startLeadConversation,
  syncLeads,
} from '../leads.utils';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  invalidateGetCache: jest.fn(),
}));
jest.mock('../village.utils', () => ({ approveVillage: jest.fn() }));
jest.mock('../users', () => ({ fetchUsersWhere: jest.fn() }));
jest.mock('../trpc', () => {
  const proc = () => ({ query: jest.fn(), mutate: jest.fn() });
  return {
    ...jest.requireActual('../trpc'),
    isTrpcEnabled: jest.fn(),
    trpc: {
      lead: Object.fromEntries(
        [
          'get',
          'list',
          'counts',
          'update',
          'contact',
          'start',
          'startBatch',
          'invite',
          'enrich',
          'sync',
          'fit',
          'actions',
          'emailDraft',
          'sendEmail',
        ].map((name) => [name, proc()]),
      ),
    },
  };
});

const mockedApi = api as unknown as Record<'get' | 'post' | 'patch', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const procs = trpc.lead as unknown as Record<
  string,
  { query: jest.Mock; mutate: jest.Mock }
>;

const card = { _id: 'l1', title: 'Lead' };

type Case = {
  name: string;
  run: () => Promise<unknown>;
  legacy: { method: 'get' | 'post' | 'patch'; url: string };
  proc: string;
  kind: 'query' | 'mutate';
  input: unknown;
  response: unknown;
  // The bare payload of a procedure that does not wrap it in `results`.
  bare?: unknown;
  result: unknown;
};

const cases: Case[] = [
  {
    name: 'fetchLead',
    run: () => fetchLead('l1'),
    legacy: { method: 'get', url: '/leads/l1' },
    proc: 'get',
    kind: 'query',
    input: { id: 'l1' },
    response: { results: card },
    bare: card,
    result: card,
  },
  {
    name: 'fetchLeadsBoard',
    run: () => fetchLeadsBoard({ page: 1, q: '' }),
    legacy: { method: 'get', url: '/leads' },
    proc: 'list',
    kind: 'query',
    input: { page: 1 },
    response: { results: [card], pagination: { total: 7 } },
    result: { rows: [card], total: 7 },
  },
  {
    name: 'fetchLeadsCounts',
    run: () => fetchLeadsCounts({ q: 'x' }),
    legacy: { method: 'get', url: '/leads/counts' },
    proc: 'counts',
    kind: 'query',
    input: { q: 'x' },
    response: { results: { all: 3 } },
    bare: { all: 3 },
    result: { all: 3 },
  },
  {
    name: 'patchLead',
    run: () => patchLead('l1', { notes: 'n' }),
    legacy: { method: 'patch', url: '/leads/l1' },
    proc: 'update',
    kind: 'mutate',
    input: { id: 'l1', data: { notes: 'n' } },
    response: { results: card },
    bare: card,
    result: card,
  },
  {
    name: 'contactLead',
    run: () => contactLead('l1', { channel: 'email' }),
    legacy: { method: 'post', url: '/leads/l1/contact' },
    proc: 'contact',
    kind: 'mutate',
    input: { id: 'l1', channel: 'email' },
    response: { results: card, contact: { channel: 'email', sent: null } },
    result: { lead: card, channel: 'email', sent: null },
  },
  {
    name: 'startLeadConversation',
    run: () => startLeadConversation('l1'),
    legacy: { method: 'post', url: '/leads/l1/start' },
    proc: 'start',
    kind: 'mutate',
    input: { id: 'l1' },
    response: { results: card, started: { claimed: true, owner: 'u1' } },
    result: { lead: card, claimed: true, owner: 'u1' },
  },
  {
    name: 'startConversationFromApplication',
    run: () => startConversationFromApplication('a1'),
    legacy: { method: 'post', url: '/leads/start' },
    proc: 'startBatch',
    kind: 'mutate',
    input: { applicationId: 'a1' },
    response: { results: card, started: { claimed: false, owner: 'u1' } },
    result: { lead: card, claimed: false, owner: 'u1' },
  },
  {
    name: 'inviteLeadToProgram',
    run: () => inviteLeadToProgram('l1', 'closer', { message: 'hi' }),
    legacy: { method: 'post', url: '/leads/l1/invite' },
    proc: 'invite',
    kind: 'mutate',
    input: { id: 'l1', program: 'closer', message: 'hi' },
    response: { results: card, invited: { program: 'closer', sent: true } },
    result: { lead: card, program: 'closer', sent: true, sendError: null },
  },
  {
    name: 'enrichLead',
    run: () => enrichLead('l1'),
    legacy: { method: 'post', url: '/leads/l1/enrich' },
    proc: 'enrich',
    kind: 'mutate',
    input: { id: 'l1' },
    response: { results: card },
    result: undefined,
  },
  {
    name: 'syncLeads',
    run: () => syncLeads(),
    legacy: { method: 'post', url: '/leads/sync' },
    proc: 'sync',
    kind: 'mutate',
    input: {},
    response: { results: {} },
    result: undefined,
  },
  {
    name: 'fetchVillageFit',
    run: () => fetchVillageFit('v1'),
    legacy: { method: 'get', url: '/village/v1/fit' },
    proc: 'fit',
    kind: 'query',
    input: { id: 'v1' },
    response: { results: { verdict: 'fit' } },
    bare: { verdict: 'fit' },
    result: { verdict: 'fit' },
  },
  {
    name: 'fetchLeadActions',
    run: () => fetchLeadActions(),
    legacy: { method: 'get', url: '/leads/actions' },
    proc: 'actions',
    kind: 'query',
    input: undefined,
    response: { results: { programs: [] } },
    bare: { programs: [] },
    result: { programs: [] },
  },
  {
    name: 'previewLeadEmail',
    run: () => previewLeadEmail({ send: 'lead_intro', leadIds: ['a', 'b'] }),
    legacy: { method: 'get', url: '/leads/email' },
    proc: 'emailDraft',
    kind: 'query',
    input: { send: 'lead_intro', leadIds: ['a', 'b'] },
    response: { results: { candidates: 2 } },
    bare: { candidates: 2 },
    result: { candidates: 2 },
  },
  {
    name: 'sendLeadEmail',
    run: () => sendLeadEmail({ send: 'lead_intro', sampleId: 's' }),
    legacy: { method: 'post', url: '/leads/email' },
    proc: 'sendEmail',
    kind: 'mutate',
    input: { send: 'lead_intro' },
    response: { results: { sent: 2 } },
    bare: { sent: 2 },
    result: { sent: 2 },
  },
];

beforeEach(() => jest.resetAllMocks());

describe.each(cases)('$name', (c) => {
  it('calls the legacy route when tRPC is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi[c.legacy.method].mockResolvedValue({ data: c.response });
    await expect(c.run()).resolves.toEqual(c.result);
    expect(mockedEnabled).toHaveBeenCalledWith('9.1a');
    expect(mockedApi[c.legacy.method].mock.calls[0][0]).toBe(c.legacy.url);
    expect(procs[c.proc][c.kind]).not.toHaveBeenCalled();
  });

  it('calls the procedure when tRPC is on', async () => {
    mockedEnabled.mockReturnValue(true);
    procs[c.proc][c.kind].mockResolvedValue(c.bare ?? c.response);
    await expect(c.run()).resolves.toEqual(c.result);
    expect(procs[c.proc][c.kind].mock.calls[0][0]).toEqual(c.input);
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.patch).not.toHaveBeenCalled();
  });
});

describe('lead procedure failures', () => {
  it('reshapes a failed mutation into the axios error', async () => {
    mockedEnabled.mockReturnValue(true);
    const { TRPCClientError } =
      jest.requireActual<typeof import('@trpc/client')>('@trpc/client');
    procs.start.mutate.mockRejectedValue(
      new TRPCClientError('Lead not found', {
        result: {
          error: { message: 'Lead not found', data: { httpStatus: 404 } },
        },
      } as ConstructorParameters<typeof TRPCClientError>[1]),
    );
    await expect(startLeadConversation('l1')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it('keeps fetchLead and fetchVillageFit swallowing a failed read', async () => {
    mockedEnabled.mockReturnValue(true);
    procs.get.query.mockRejectedValue(new Error('x'));
    procs.fit.query.mockRejectedValue(new Error('x'));
    await expect(fetchLead('l1')).resolves.toBeNull();
    await expect(fetchVillageFit('v1')).resolves.toBeNull();
  });
});
