/**
 * @jest-environment node
 */
import { parseMessageFromError } from '../common';

const mockGetAccessToken = jest.fn<string | undefined, []>();
const mockRefreshTokensProactively = jest.fn(() => Promise.resolve(null));

jest.mock('../authStorage', () => ({
  getAccessToken: () => mockGetAccessToken(),
}));
jest.mock('../api', () => ({
  refreshTokensProactively: () => mockRefreshTokensProactively(),
}));

const TRPC_URL = 'http://api.test/trpc';
process.env.NEXT_PUBLIC_TRPC_URL = TRPC_URL;
// The client reads the URL once at import, so the env has to be set first.
const { isTrpcEnabled, toApiError, trpc } = require('../trpc');

const fetchMock = jest.fn();
global.fetch = fetchMock;

const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );

const errorBody = (
  message: string,
  data: Record<string, unknown>,
): unknown[] => [{ error: { message, code: -32600, data } }];

const failureOf = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error('expected the call to fail');
};

beforeEach(() => {
  fetchMock.mockReset();
  mockGetAccessToken.mockReset();
  mockRefreshTokensProactively.mockClear();
  process.env.NEXT_PUBLIC_TRPC_URL = TRPC_URL;
});

describe('isTrpcEnabled', () => {
  it('is on when NEXT_PUBLIC_TRPC_URL is set', () => {
    expect(isTrpcEnabled()).toBe(true);
  });

  it('is off when NEXT_PUBLIC_TRPC_URL is unset or empty', () => {
    delete process.env.NEXT_PUBLIC_TRPC_URL;
    expect(isTrpcEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_TRPC_URL = '';
    expect(isTrpcEnabled()).toBe(false);
  });
});

describe('trpc client', () => {
  it('sends the access token as a bearer', async () => {
    mockGetAccessToken.mockReturnValue('jwt-123');
    respond(200, [{ result: { data: [] } }]);

    await trpc.food.list.query();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(new RegExp(`^${TRPC_URL}/food.list\\?`));
    expect(new Headers(init.headers).get('authorization')).toBe(
      'Bearer jwt-123',
    );
    expect(mockRefreshTokensProactively).toHaveBeenCalled();
  });

  it('sends no Authorization header without a token', async () => {
    mockGetAccessToken.mockReturnValue(undefined);
    respond(200, [{ result: { data: [] } }]);

    await trpc.food.list.query();

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).has('authorization')).toBe(false);
  });
});

describe('toApiError', () => {
  it('names the field the way closer-api safeWrite does, through the update wrapper', async () => {
    const issues = [
      {
        code: 'custom',
        path: ['data', 'price'],
        message: 'expected a number, received "abc"',
      },
    ];
    respond(
      400,
      errorBody(JSON.stringify(issues, null, 2), {
        code: 'BAD_REQUEST',
        httpStatus: 400,
        zodError: {
          formErrors: [],
          fieldErrors: { data: [issues[0].message] },
        },
      }),
    );

    const error = await failureOf(
      trpc.food.update.mutate({ search: 'x', data: { price: 'abc' } }),
    );

    expect(parseMessageFromError(toApiError(error))).toBe(
      'Invalid value for "price" (expected a number, received "abc")',
    );
  });

  it('lists every failing field once, from the flattened error when the message is not JSON', async () => {
    respond(
      400,
      errorBody('Input validation failed', {
        code: 'BAD_REQUEST',
        httpStatus: 400,
        zodError: {
          formErrors: [],
          fieldErrors: {
            price: ['expected a number, received "abc"', 'second issue'],
            channel: ['expected an id, received boolean'],
          },
        },
      }),
    );

    const error = await failureOf(trpc.food.create.mutate({}));

    expect(parseMessageFromError(toApiError(error))).toBe(
      'Invalid values for "price" (expected a number, received "abc"), "channel" (expected an id, received boolean)',
    );
  });

  it('keeps the server message for other failures, with the HTTP status', async () => {
    respond(
      400,
      errorBody('Duplicate entry.', {
        code: 'BAD_REQUEST',
        httpStatus: 400,
        zodError: null,
      }),
    );

    const mapped = toApiError(
      await failureOf(trpc.food.create.mutate({ name: 'Basic' })),
    );

    expect(parseMessageFromError(mapped)).toBe('Duplicate entry.');
    expect(mapped).toMatchObject({
      response: { status: 400, data: { error: 'Duplicate entry.' } },
    });
  });

  it('reports an unreachable API the way axios does', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    const error = await failureOf(trpc.food.list.query());

    expect(parseMessageFromError(toApiError(error))).toBe('Network Error');
  });

  it('passes anything that is not a tRPC error through untouched', () => {
    const error = new Error('Please set a valid name');
    expect(toApiError(error)).toBe(error);
  });
});
