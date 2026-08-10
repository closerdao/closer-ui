/**
 * The API authorises anonymous POSTs (public form submissions) via the
 * interaction session rather than a bearer token, and returns 401 when that
 * session is missing or stale. These cover the recovery path in api.js.
 */
let storedKey: string | null = 'valid-key';

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
  ensureInteractionSession: jest.fn(async () => undefined),
  getStoredInteractionSessionKey: jest.fn(() => storedKey),
  refreshInteractionSession: jest.fn(async () => {
    storedKey = 'fresh-key';
  }),
}));

import api from '../api';
import { refreshInteractionSession } from '../interactionSession';

type Attempt = { url?: string };

const makeAxiosError = (config: unknown, status: number) => {
  const err = new Error(`Request failed with status code ${status}`) as Error & {
    config: unknown;
    response: unknown;
    isAxiosError: boolean;
  };
  err.config = config;
  err.response = { status, data: {}, config, headers: {} };
  err.isAxiosError = true;
  return err;
};

/** Fails the first `failTimes` requests with 401, then succeeds. */
const installAdapter = (failTimes: number) => {
  const attempts: Attempt[] = [];
  let failures = 0;
  (api.defaults as any).adapter = async (config: any) => {
    attempts.push({ url: config.url });
    if (failures < failTimes) {
      failures += 1;
      throw makeAxiosError(config, 401);
    }
    return {
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    };
  };
  return attempts;
};

describe('anonymous 401 interaction recovery', () => {
  beforeEach(() => {
    storedKey = 'valid-key';
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('refreshes the interaction session and retries a public form post', async () => {
    const attempts = installAdapter(1);

    const res = await api.post('/application', { email: 'a@b.co' });

    expect(res.status).toBe(200);
    expect(refreshInteractionSession).toHaveBeenCalledTimes(1);
    expect(attempts.map((a) => a.url)).toEqual(['/application', '/application']);
  });

  it('retries at most once', async () => {
    const attempts = installAdapter(2);

    await expect(api.post('/application', {})).rejects.toBeTruthy();

    expect(refreshInteractionSession).toHaveBeenCalledTimes(1);
    expect(attempts).toHaveLength(2);
  });

  it('does not retry a failed login, which would double the attempt', async () => {
    const attempts = installAdapter(1);

    await expect(
      api.post('/login', { email: 'a@b.co', password: 'wrong' }),
    ).rejects.toBeTruthy();

    expect(refreshInteractionSession).not.toHaveBeenCalled();
    expect(attempts).toHaveLength(1);
  });
});
