import { TRPCClientError } from '@trpc/client';

import api from '../api';
import * as stays from '../stays.api';
import { isTrpcEnabled, trpc, trpcFor } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockServerGet = jest.fn();

jest.mock('../trpc', () => {
  const mk = () => ({ mutate: jest.fn(), query: jest.fn() });
  const names = [
    'create',
    'get',
    'setOptions',
    'quote',
    'setPaymentMethod',
    'submit',
    'approve',
    'reject',
    'cancel',
    'setStatus',
    'checkIn',
    'checkOut',
    'adminCreate',
    'proposeChange',
    'pendingChange',
    'confirmChange',
    'discardChange',
    'releaseChange',
    'approveChange',
    'addGuest',
    'removeGuest',
    'sendToFriend',
    'claimAsFriend',
  ];
  const stay = Object.fromEntries(names.map((n) => [n, mk()]));
  return {
    ...jest.requireActual('../trpc'),
    isTrpcEnabled: jest.fn(),
    trpc: { stay },
    trpcFor: jest.fn(() => ({ stay: { get: { query: mockServerGet } } })),
  };
});

const mockedApi = api as unknown as Record<string, jest.Mock>;
const proc = trpc.stay as unknown as Record<string, Record<string, jest.Mock>>;

const stay = { _id: 's1', status: 'paid' };

type Case = {
  name: string;
  call: () => Promise<unknown>;
  legacy: [string, string, ...unknown[]];
  legacyData?: unknown;
  procedure: string;
  kind: 'mutate' | 'query';
  input: unknown;
  result?: unknown;
  expected?: unknown;
};

const cases: Case[] = [
  {
    name: 'createStay',
    call: () => stays.createStay({ start: 'a', end: 'b' } as never),
    legacy: ['post', '/stays', { start: 'a', end: 'b' }],
    procedure: 'create',
    kind: 'mutate',
    input: { start: 'a', end: 'b' },
  },
  {
    name: 'getStay',
    call: () => stays.getStay('s1'),
    legacy: ['get', '/stays/s1', { cache: false, headers: undefined }],
    procedure: 'get',
    kind: 'query',
    input: { id: 's1' },
  },
  {
    name: 'createAdminStay',
    call: () =>
      stays.createAdminStay({
        listingId: 'l',
        start: 'a',
        end: 'b',
        adults: 1,
      }),
    legacy: [
      'post',
      '/stays/admin',
      { listingId: 'l', start: 'a', end: 'b', adults: 1 },
    ],
    procedure: 'adminCreate',
    kind: 'mutate',
    input: { listingId: 'l', start: 'a', end: 'b', adults: 1 },
  },
  {
    name: 'updateStayOptions',
    call: () => stays.updateStayOptions('s1', { message: 'hi' }),
    legacy: ['patch', '/stays/s1/options', { message: 'hi' }],
    procedure: 'setOptions',
    kind: 'mutate',
    input: { id: 's1', message: 'hi' },
  },
  {
    name: 'setStayPaymentMethod',
    call: () => stays.setStayPaymentMethod('s1', { method: 'fiat' } as never),
    legacy: ['post', '/stays/s1/payment-method', { method: 'fiat' }],
    procedure: 'setPaymentMethod',
    kind: 'mutate',
    input: { id: 's1', method: 'fiat' },
  },
  {
    name: 'quoteStay',
    call: () => stays.quoteStay('s1', { adults: 2 }),
    legacy: ['post', '/stays/s1/quote', { adults: 2 }],
    procedure: 'quote',
    kind: 'mutate',
    input: { id: 's1', adults: 2 },
  },
  {
    name: 'submitStay',
    call: () => stays.submitStay('s1'),
    legacy: ['post', '/stays/s1/submit', {}],
    procedure: 'submit',
    kind: 'mutate',
    input: { id: 's1' },
  },
  {
    name: 'cancelStay',
    call: () => stays.cancelStay('s1'),
    legacy: ['post', '/stays/s1/cancel', {}],
    procedure: 'cancel',
    kind: 'mutate',
    input: { id: 's1' },
    result: { booking: stay, refund: null },
  },
  {
    name: 'proposeStayModification',
    call: () => stays.proposeStayModification('s1', { adults: 2 }),
    legacy: ['post', '/stays/s1/modification', { adults: 2 }],
    procedure: 'proposeChange',
    kind: 'mutate',
    input: { id: 's1', adults: 2 },
    result: { booking: stay },
    expected: stay,
  },
  {
    name: 'getStayModification',
    call: () => stays.getStayModification('s1'),
    legacy: ['get', '/stays/s1/modification'],
    legacyData: { pendingModification: { quote: 1 } },
    procedure: 'pendingChange',
    kind: 'query',
    input: { id: 's1' },
    result: { pendingModification: { quote: 1 } },
    expected: { quote: 1 },
  },
  {
    name: 'confirmStayModification',
    call: () => stays.confirmStayModification('s1', 'why'),
    legacy: ['post', '/stays/s1/modification/confirm', { reason: 'why' }],
    legacyData: { booking: stay, refund: { x: 1 } },
    procedure: 'confirmChange',
    kind: 'mutate',
    input: { id: 's1', reason: 'why' },
    result: { booking: stay, refund: { x: 1 } },
    expected: { stay, refund: { x: 1 } },
  },
  {
    name: 'approveStayModification',
    call: () => stays.approveStayModification('s1', 'ok'),
    legacy: ['post', '/stays/s1/modification/approve', { reason: 'ok' }],
    procedure: 'approveChange',
    kind: 'mutate',
    input: { id: 's1', reason: 'ok' },
    result: { booking: stay },
    expected: stay,
  },
  {
    name: 'discardStayModification',
    call: () => stays.discardStayModification('s1'),
    legacy: ['post', '/stays/s1/modification/discard', {}],
    procedure: 'discardChange',
    kind: 'mutate',
    input: { id: 's1' },
    result: { booking: stay },
    expected: stay,
  },
  {
    name: 'releaseStayModification',
    call: () => stays.releaseStayModification('s1', 'stuck'),
    legacy: ['post', '/stays/s1/modification/release', { reason: 'stuck' }],
    procedure: 'releaseChange',
    kind: 'mutate',
    input: { id: 's1', reason: 'stuck' },
    result: { booking: stay },
    expected: stay,
  },
  {
    name: 'addStayGuest',
    call: () => stays.addStayGuest('s1', 'u1'),
    legacy: ['post', '/stays/s1/guests', { userId: 'u1' }],
    procedure: 'addGuest',
    kind: 'mutate',
    input: { id: 's1', userId: 'u1' },
  },
  {
    name: 'removeStayGuest',
    call: () => stays.removeStayGuest('s1', 'u1'),
    legacy: ['delete', '/stays/s1/guests', { data: { userId: 'u1' } }],
    procedure: 'removeGuest',
    kind: 'mutate',
    input: { id: 's1' },
  },
  {
    name: 'approveStayRequest',
    call: () => stays.approveStayRequest('s1', 'ok'),
    legacy: ['post', '/stays/s1/approve', { reason: 'ok' }],
    procedure: 'approve',
    kind: 'mutate',
    input: { id: 's1', reason: 'ok' },
  },
  {
    name: 'rejectStayRequest',
    call: () => stays.rejectStayRequest('s1', 'no'),
    legacy: ['post', '/stays/s1/reject', { reason: 'no' }],
    procedure: 'reject',
    kind: 'mutate',
    input: { id: 's1', reason: 'no' },
  },
  {
    name: 'setStayStatus',
    call: () => stays.setStayStatus('s1', 'pending', 'confirmed', 'r'),
    legacy: [
      'post',
      '/stays/s1/set-status',
      { from: 'pending', status: 'confirmed', reason: 'r' },
    ],
    procedure: 'setStatus',
    kind: 'mutate',
    input: { id: 's1', from: 'pending', status: 'confirmed', reason: 'r' },
  },
  {
    name: 'sendStayToFriends (string)',
    call: () => stays.sendStayToFriends('s1', 'a@x.io, b@x.io'),
    legacy: [
      'post',
      '/stays/s1/send-to-friend',
      { friendEmails: ['a@x.io', 'b@x.io'] },
    ],
    procedure: 'sendToFriend',
    kind: 'mutate',
    input: { id: 's1', friendEmails: ['a@x.io', 'b@x.io'] },
    result: { emailsSent: 2 },
  },
  {
    name: 'sendStayToFriends (none)',
    call: () => stays.sendStayToFriends('s1'),
    legacy: ['post', '/stays/s1/send-to-friend', {}],
    procedure: 'sendToFriend',
    kind: 'mutate',
    input: { id: 's1' },
    result: { emailsSent: 0 },
  },
  {
    name: 'claimStayAsFriend',
    call: () => stays.claimStayAsFriend('s1'),
    legacy: ['post', '/stays/s1/claim-as-friend', {}],
    procedure: 'claimAsFriend',
    kind: 'mutate',
    input: { id: 's1' },
  },
  {
    name: 'checkInStay',
    call: () => stays.checkInStay('s1'),
    legacy: ['post', '/stays/s1/check-in', {}],
    procedure: 'checkIn',
    kind: 'mutate',
    input: { id: 's1' },
  },
  {
    name: 'checkOutStay',
    call: () => stays.checkOutStay('s1'),
    legacy: ['post', '/stays/s1/check-out', {}],
    procedure: 'checkOut',
    kind: 'mutate',
    input: { id: 's1' },
  },
];

describe('stay flow helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(cases)(
    '$name calls the legacy route with the group off',
    async (c) => {
      (isTrpcEnabled as jest.Mock).mockReturnValue(false);
      const [method, url, ...rest] = c.legacy;
      mockedApi[method].mockResolvedValue({
        data: { results: c.legacyData ?? c.result ?? stay },
      });

      await c.call();

      expect(mockedApi[method]).toHaveBeenCalledWith(url, ...rest);
      expect(proc[c.procedure][c.kind]).not.toHaveBeenCalled();
    },
  );

  it.each(cases)('$name calls the procedure with the group on', async (c) => {
    (isTrpcEnabled as jest.Mock).mockReturnValue(true);
    const result = c.result ?? stay;
    proc[c.procedure][c.kind].mockResolvedValue(result);

    const out = await c.call();

    expect(isTrpcEnabled).toHaveBeenCalledWith('11.1a');
    expect(proc[c.procedure][c.kind]).toHaveBeenCalledWith(c.input);
    expect(out).toEqual(c.expected ?? result);
    Object.values(mockedApi).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });

  it('maps a procedure error to the legacy error shape', async () => {
    (isTrpcEnabled as jest.Mock).mockReturnValue(true);
    proc.approve.mutate.mockRejectedValue(
      new TRPCClientError(
        'Only pending stays can be approved (current: paid).',
        {
          result: { error: { data: { code: 'BAD_REQUEST', httpStatus: 400 } } },
        } as never,
      ),
    );

    await expect(stays.approveStayRequest('s1', 'ok')).rejects.toMatchObject({
      response: {
        data: { error: 'Only pending stays can be approved (current: paid).' },
      },
    });
  });

  it('reads a stay on the server render with the request token', async () => {
    (isTrpcEnabled as jest.Mock).mockReturnValue(true);
    mockServerGet.mockResolvedValue(stay);

    await stays.getStay('s1', 'tok');

    expect(trpcFor).toHaveBeenCalledWith('tok');
    expect(mockServerGet).toHaveBeenCalledWith({ id: 's1' });
    expect(proc.get.query).not.toHaveBeenCalled();
  });

  it('sends the request token to the legacy route on the server render', async () => {
    (isTrpcEnabled as jest.Mock).mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: stay } });

    await stays.getStay('s1', 'tok');

    expect(mockedApi.get).toHaveBeenCalledWith('/stays/s1', {
      cache: false,
      headers: { Authorization: 'Bearer tok' },
    });
  });
});
