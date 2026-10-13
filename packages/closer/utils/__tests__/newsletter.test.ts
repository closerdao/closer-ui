import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { applyInteractionIsHumanFromResponse } from '../interactionSession';
import { subscribe } from '../newsletter';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../interactionSession', () => ({
  applyInteractionIsHumanFromResponse: jest.fn(),
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: { newsletter: { subscribe: { mutate: jest.fn() } } },
}));

const mockedApi = api as unknown as { post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const mockedSubscribe = trpc.newsletter.subscribe
  .mutate as unknown as jest.Mock;
const mockedApplyIsHuman = applyInteractionIsHumanFromResponse as jest.Mock;

const form = {
  email: 'ada@example.com',
  screenname: '',
  tags: ['signup-modal'],
  turnstileToken: 'tt',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('subscribe', () => {
  it('posts the whole form to legacy /subscribe with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({
      data: { status: 'Subscription successful' },
    });

    await expect(subscribe(form)).resolves.toEqual({
      status: 'Subscription successful',
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/subscribe', form);
    expect(mockedSubscribe).not.toHaveBeenCalled();
    // The axios response interceptor applies isHuman on this path.
    expect(mockedApplyIsHuman).not.toHaveBeenCalled();
  });

  it('calls newsletter.subscribe with only its fields with the flag on and applies isHuman', async () => {
    mockedEnabled.mockReturnValue(true);
    const result = { status: 'Subscription successful', isHuman: true };
    mockedSubscribe.mockResolvedValue(result);

    await expect(subscribe(form)).resolves.toBe(result);
    expect(mockedSubscribe).toHaveBeenCalledWith({
      email: 'ada@example.com',
      tags: ['signup-modal'],
      turnstileToken: 'tt',
    });
    expect(mockedApplyIsHuman).toHaveBeenCalledWith(result);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a failed human check in legacy error shape', async () => {
    mockedEnabled.mockReturnValue(true);
    const message = 'Turnstile verification failed.';
    mockedSubscribe.mockRejectedValue(
      new TRPCClientError(message, {
        result: {
          error: {
            message,
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
          },
        },
      }),
    );

    await expect(subscribe(form)).rejects.toMatchObject({
      response: { status: 400, data: { error: message } },
    });
    expect(mockedApplyIsHuman).not.toHaveBeenCalled();
  });
});
