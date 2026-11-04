import {
  ensureInteractionSession,
  refreshInteractionSession,
} from '../interactionSession';

let storedKey: string | null = 'session-key';

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
  ensureInteractionSession: jest.fn(async () => undefined),
  getStoredInteractionSessionKey: jest.fn(() => storedKey),
  refreshInteractionSession: jest.fn(async () => {
    storedKey = 'fresh-key';
  }),
}));

const mockAccessToken = jest.fn<string | undefined, []>();

jest.mock('../authStorage', () => ({
  ...jest.requireActual('../authStorage'),
  getAccessToken: () => mockAccessToken(),
}));

const TRPC_URL = 'http://api.test/trpc';
process.env.NEXT_PUBLIC_TRPC_URL = TRPC_URL;
// The tRPC client reads its URL at import, so the env has to be set first.
const { default: api } = require('../api');
const { linkedMetricFields, logMetric } = require('../metrics');

type Captured = { method?: string; url?: string; data?: string; headers: any };

const axiosCalls: Captured[] = [];
let axiosReply: (config: any) => Promise<unknown>;

beforeAll(() => {
  api.defaults.adapter = async (config: any) => {
    axiosCalls.push({
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
    });
    return axiosReply(config);
  };
});

const ok = (config: any) =>
  Promise.resolve({
    data: { results: {} },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: {},
  });

const axiosFailure =
  (status: number, headers: Record<string, string> = {}) =>
  (config: any) =>
    Promise.reject(
      Object.assign(new Error(`Request failed with status code ${status}`), {
        config,
        response: { status, data: {}, headers, config },
        isAxiosError: true,
      }),
    );

const fetchMock = jest.fn();

const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce({
    ok: status < 400,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  });

const trpcFailure = (code: string, httpStatus: number, message: string) => [
  { error: { message, code: -32600, data: { code, httpStatus } } },
];

const fetchHeaders = (call: number) =>
  fetchMock.mock.calls[call][1].headers as Record<string, string>;

const referral = {
  event: 'referral-view',
  category: 'affiliate',
  value: 'abc',
  ...linkedMetricFields('Affiliate', 'abc'),
};

let warn: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  storedKey = 'session-key';
  axiosCalls.length = 0;
  axiosReply = ok;
  fetchMock.mockReset();
  global.fetch = fetchMock;
  mockAccessToken.mockReturnValue(undefined);
  jest.clearAllMocks();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  error = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  error.mockRestore();
});

describe('logMetric with tRPC off', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_TRPC_URL;
  });

  it('posts the legacy body with point 1 and the interaction header', async () => {
    await logMetric(referral);

    expect(axiosCalls).toHaveLength(1);
    expect(axiosCalls[0]).toMatchObject({ method: 'post', url: '/metric' });
    expect(axiosCalls[0].data).toBe(
      '{"event":"referral-view","category":"affiliate","value":"abc","point":1,"linkedObjectType":"Affiliate","linkedObjectId":"abc"}',
    );
    expect(axiosCalls[0].headers.get('X-Interaction-Session')).toBe(
      'session-key',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts a navigation metric with only what was given', async () => {
    await logMetric({ category: 'navigation', event: '/stay' });

    expect(axiosCalls[0].data).toBe(
      '{"event":"/stay","category":"navigation","point":1}',
    );
  });

  it('keeps an explicit point', async () => {
    await logMetric({ event: 'token-sale', category: 'token', point: 30 });

    expect(JSON.parse(axiosCalls[0].data!).point).toBe(30);
  });

  it('only warns on 429, with Retry-After', async () => {
    axiosReply = axiosFailure(429, { 'retry-after': '60' });

    await expect(logMetric(referral)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      'Metric rate limited (429) for "referral-view".',
      'Retry-After: 60',
    );
    expect(error).not.toHaveBeenCalled();
  });

  it('swallows any other failure after logging it', async () => {
    axiosReply = axiosFailure(500);

    await expect(logMetric(referral)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      'Error tracking metric "referral-view":',
      expect.any(Error),
    );
  });
});

describe('logMetric with tRPC on', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TRPC_URL = TRPC_URL;
  });

  it('calls metric.log with the same fields and the interaction header', async () => {
    respond(200, [{ result: { data: { _id: 'm1' } } }]);

    await logMetric(referral);

    expect(axiosCalls).toHaveLength(0);
    expect(ensureInteractionSession).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${TRPC_URL}/metric.log?batch=1`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      0: {
        event: 'referral-view',
        category: 'affiliate',
        value: 'abc',
        point: 1,
        linkedObjectType: 'Affiliate',
        linkedObjectId: 'abc',
      },
    });
    expect(fetchHeaders(0)['X-Interaction-Session']).toBe('session-key');
    expect(fetchHeaders(0).Authorization).toBeUndefined();
  });

  it('sends the token beside the interaction session when signed in', async () => {
    mockAccessToken.mockReturnValue('jwt-1');
    respond(200, [{ result: { data: {} } }]);

    await logMetric({ category: 'navigation', event: '/stay' });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      0: { event: '/stay', category: 'navigation', point: 1 },
    });
    expect(fetchHeaders(0)).toMatchObject({
      Authorization: 'Bearer jwt-1',
      'X-Interaction-Session': 'session-key',
    });
  });

  it('only warns on TOO_MANY_REQUESTS', async () => {
    respond(
      429,
      trpcFailure('TOO_MANY_REQUESTS', 429, 'Too many requests, try later.'),
    );

    await expect(logMetric(referral)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      'Metric rate limited (429) for "referral-view".',
      '',
    );
    expect(error).not.toHaveBeenCalled();
  });

  it('retries an anonymous UNAUTHORIZED once on a fresh interaction session', async () => {
    respond(401, trpcFailure('UNAUTHORIZED', 401, 'Please sign in.'));
    respond(200, [{ result: { data: {} } }]);

    await logMetric(referral);

    expect(refreshInteractionSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchHeaders(0)['X-Interaction-Session']).toBe('session-key');
    expect(fetchHeaders(1)['X-Interaction-Session']).toBe('fresh-key');
    expect(error).not.toHaveBeenCalled();
  });

  it('logs and swallows a second UNAUTHORIZED', async () => {
    respond(401, trpcFailure('UNAUTHORIZED', 401, 'Please sign in.'));
    respond(401, trpcFailure('UNAUTHORIZED', 401, 'Please sign in.'));

    await expect(logMetric(referral)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith(
      'Error tracking metric "referral-view":',
      expect.objectContaining({ message: 'Please sign in.' }),
    );
  });
});
