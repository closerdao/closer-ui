import { TRPCClientError } from '@trpc/client';

import api from '../api';
import {
  fetchHasStayedMinDuration,
  fetchIsVouched,
  removeVouchForUser,
  submitCitizenApplication,
  updateVouchForUser,
  vouchForUser,
} from '../citizenship';
import { parseMessageFromError } from '../common';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    citizenship: {
      submitApplication: { mutate: jest.fn() },
      hasStayedMinDuration: { query: jest.fn() },
      isVouched: { query: jest.fn() },
      vouch: { mutate: jest.fn() },
      updateVouch: { mutate: jest.fn() },
      removeVouch: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<
  'get' | 'post' | 'patch' | 'delete',
  jest.Mock
>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const citizenship = trpc.citizenship as unknown as {
  submitApplication: { mutate: jest.Mock };
  hasStayedMinDuration: { query: jest.Mock };
  isVouched: { query: jest.Mock };
  vouch: { mutate: jest.Mock };
  updateVouch: { mutate: jest.Mock };
  removeVouch: { mutate: jest.Mock };
};

const user = { _id: 'u1', vouched: [{ vouchedBy: 'me', message: 'hi' }] };
const stayed = {
  hasStayedForMinDuration: true,
  totalNights: 21,
  minStayDuration: 14,
};

const badRequest = (message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('posts the application and returns its body', async () => {
    mockedApi.post.mockResolvedValue({ data: { status: 'success' } });

    await expect(submitCitizenApplication()).resolves.toEqual({
      status: 'success',
    });

    expect(mockedApi.post.mock.calls).toEqual([
      ['/subscription/citizen/apply'],
    ]);
    expect(citizenship.submitApplication.mutate).not.toHaveBeenCalled();
  });

  it('passes a refused application through as legacy rejected it', async () => {
    const refusal = {
      response: {
        status: 400,
        data: { status: 'failed', error: 'User is not vouched' },
      },
    };
    mockedApi.post.mockRejectedValue(refusal);

    await expect(submitCitizenApplication()).rejects.toBe(refusal);
  });

  it('reads both checks off the response body', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: stayed })
      .mockResolvedValueOnce({ data: { isVouched: true } });

    await expect(fetchHasStayedMinDuration()).resolves.toEqual(stayed);
    await expect(fetchIsVouched()).resolves.toEqual({ isVouched: true });

    expect(mockedApi.get.mock.calls).toEqual([
      ['/subscription/citizen/check-has-stayed-for-min-duration'],
      ['/subscription/citizen/check-is-vouched'],
    ]);
  });

  it('makes the three /users/:id/vouch calls', async () => {
    const body = { results: { user } };
    mockedApi.post.mockResolvedValue({ data: body });
    mockedApi.patch.mockResolvedValue({ data: body });
    mockedApi.delete.mockResolvedValue({ data: body });

    await expect(vouchForUser('u1', 'hi')).resolves.toBe(body);
    await expect(updateVouchForUser('u1', 'hello')).resolves.toBe(body);
    await expect(removeVouchForUser('u1')).resolves.toBe(body);

    expect(mockedApi.post.mock.calls).toEqual([
      ['/users/u1/vouch', { message: 'hi' }],
    ]);
    expect(mockedApi.patch.mock.calls).toEqual([
      ['/users/u1/vouch', { message: 'hello' }],
    ]);
    expect(mockedApi.delete.mock.calls).toEqual([['/users/u1/vouch']]);
    expect(citizenship.vouch.mutate).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('submits the application', async () => {
    citizenship.submitApplication.mutate.mockResolvedValue({
      status: 'success',
    });

    await expect(submitCitizenApplication()).resolves.toEqual({
      status: 'success',
    });

    expect(citizenship.submitApplication.mutate).toHaveBeenCalledWith();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a refused application as a 400 with the refusal text', async () => {
    citizenship.submitApplication.mutate.mockRejectedValue(
      badRequest('User is not vouched'),
    );

    const error = await submitCitizenApplication().catch((e) => e);

    expect(error.response).toEqual({
      status: 400,
      data: { error: 'User is not vouched' },
    });
    expect(parseMessageFromError(error)).toBe('User is not vouched');
  });

  it('runs both checks', async () => {
    citizenship.hasStayedMinDuration.query.mockResolvedValue(stayed);
    citizenship.isVouched.query.mockResolvedValue({ isVouched: false });

    await expect(fetchHasStayedMinDuration()).resolves.toEqual(stayed);
    await expect(fetchIsVouched()).resolves.toEqual({ isVouched: false });

    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('wraps each vouch result in legacy `{ results: { user } }`', async () => {
    citizenship.vouch.mutate.mockResolvedValue({ user });
    citizenship.updateVouch.mutate.mockResolvedValue({ user });
    citizenship.removeVouch.mutate.mockResolvedValue({ user });

    await expect(vouchForUser('u1', 'hi')).resolves.toEqual({
      results: { user },
    });
    await expect(updateVouchForUser('u1', 'hello')).resolves.toEqual({
      results: { user },
    });
    await expect(removeVouchForUser('u1')).resolves.toEqual({
      results: { user },
    });

    expect(citizenship.vouch.mutate).toHaveBeenCalledWith({
      userId: 'u1',
      message: 'hi',
    });
    expect(citizenship.updateVouch.mutate).toHaveBeenCalledWith({
      userId: 'u1',
      message: 'hello',
    });
    expect(citizenship.removeVouch.mutate).toHaveBeenCalledWith({
      userId: 'u1',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a refused vouch with the refusal text', async () => {
    citizenship.vouch.mutate.mockRejectedValue(
      badRequest('You have already vouched for this user'),
    );

    const error = await vouchForUser('u1', 'hi').catch((e) => e);

    expect(parseMessageFromError(error)).toBe(
      'You have already vouched for this user',
    );
  });
});
